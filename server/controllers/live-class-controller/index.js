const Course = require("../../models/Course");
const LiveClass = require("../../models/LiveClass");
const StudentCourses = require("../../models/StudentCourses");

function sanitizeSegment(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function buildJitsiRoomName(courseTitle, liveClassTitle) {
  const courseSegment = sanitizeSegment(courseTitle) || "course";
  const classSegment = sanitizeSegment(liveClassTitle) || "live-class";
  const uniqueSuffix = `${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`;

  return `vikash-${courseSegment}-${classSegment}-${uniqueSuffix}`;
}

function getLiveClassStatus(liveClass) {
  if (liveClass.recordingUrl) return "recorded";

  const scheduledFor = new Date(liveClass.scheduledFor);
  const durationMinutes = Number(liveClass.durationMinutes) || 60;
  const endsAt = new Date(scheduledFor.getTime() + durationMinutes * 60 * 1000);
  const now = new Date();

  if (now < scheduledFor) return "upcoming";
  if (now <= endsAt) return "live";

  return "ended";
}

function serializeLiveClass(liveClass) {
  const plainLiveClass =
    typeof liveClass.toObject === "function" ? liveClass.toObject() : liveClass;

  return {
    ...plainLiveClass,
    status: getLiveClassStatus(plainLiveClass),
  };
}

async function findManageableCourse(reqUser, courseId) {
  const course = await Course.findById(courseId);

  if (!course) {
    return {
      error: {
        status: 404,
        message: "Course not found",
      },
    };
  }

  if (
    reqUser?.role !== "admin" &&
    String(course.instructorId) !== String(reqUser?._id)
  ) {
    return {
      error: {
        status: 403,
        message: "You can manage live classes only for your own courses",
      },
    };
  }

  return { course };
}

function canManageLiveClass(reqUser, liveClass) {
  return (
    reqUser?.role === "admin" ||
    String(liveClass?.instructorId) === String(reqUser?._id)
  );
}

const createLiveClass = async (req, res) => {
  try {
    const {
      courseId,
      title,
      description,
      scheduledFor,
      durationMinutes,
      recordingUrl,
      recordingPublicId,
    } = req.body;

    if (!courseId || !title || !scheduledFor) {
      return res.status(400).json({
        success: false,
        message: "courseId, title and scheduledFor are required",
      });
    }

    const parsedSchedule = new Date(scheduledFor);
    if (Number.isNaN(parsedSchedule.getTime())) {
      return res.status(400).json({
        success: false,
        message: "scheduledFor must be a valid date",
      });
    }

    const { course, error } = await findManageableCourse(req.user, courseId);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    const roomName = buildJitsiRoomName(course.title, title);
    const liveClass = await LiveClass.create({
      courseId: String(course._id),
      courseTitle: course.title,
      courseImage: course.image || "",
      instructorId: String(course.instructorId),
      instructorName: course.instructorName,
      title: String(title).trim(),
      description: description || "",
      scheduledFor: parsedSchedule,
      durationMinutes:
        Number.isFinite(Number(durationMinutes)) && Number(durationMinutes) > 0
          ? Number(durationMinutes)
          : 60,
      roomName,
      meetingLink: `https://meet.jit.si/${roomName}`,
      recordingUrl: recordingUrl || "",
      recordingPublicId: recordingPublicId || "",
    });

    return res.status(201).json({
      success: true,
      message: "Live class created successfully",
      data: serializeLiveClass(liveClass),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error creating live class",
    });
  }
};

const getInstructorLiveClasses = async (req, res) => {
  try {
    const query =
      req.user?.role === "admin"
        ? {}
        : { instructorId: String(req.user._id) };

    if (req.query.courseId) {
      query.courseId = String(req.query.courseId);
    }

    const liveClasses = await LiveClass.find(query).sort({
      scheduledFor: 1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: liveClasses.map(serializeLiveClass),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error fetching live classes",
    });
  }
};

const updateLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found",
      });
    }

    if (!canManageLiveClass(req.user, liveClass)) {
      return res.status(403).json({
        success: false,
        message: "You can update only your own live classes",
      });
    }

    const {
      courseId,
      title,
      description,
      scheduledFor,
      durationMinutes,
      recordingUrl,
      recordingPublicId,
    } = req.body;

    if (courseId && String(courseId) !== String(liveClass.courseId)) {
      const { course, error } = await findManageableCourse(req.user, courseId);
      if (error) {
        return res.status(error.status).json({
          success: false,
          message: error.message,
        });
      }

      liveClass.courseId = String(course._id);
      liveClass.courseTitle = course.title;
      liveClass.courseImage = course.image || "";
      liveClass.instructorId = String(course.instructorId);
      liveClass.instructorName = course.instructorName;
    }

    if (title !== undefined) liveClass.title = String(title).trim();
    if (description !== undefined) liveClass.description = description;
    if (scheduledFor !== undefined) {
      const parsedSchedule = new Date(scheduledFor);
      if (Number.isNaN(parsedSchedule.getTime())) {
        return res.status(400).json({
          success: false,
          message: "scheduledFor must be a valid date",
        });
      }

      liveClass.scheduledFor = parsedSchedule;
    }
    if (
      durationMinutes !== undefined &&
      Number.isFinite(Number(durationMinutes)) &&
      Number(durationMinutes) > 0
    ) {
      liveClass.durationMinutes = Number(durationMinutes);
    }
    if (recordingUrl !== undefined) liveClass.recordingUrl = recordingUrl;
    if (recordingPublicId !== undefined) {
      liveClass.recordingPublicId = recordingPublicId;
    }

    await liveClass.save();

    return res.status(200).json({
      success: true,
      message: "Live class updated successfully",
      data: serializeLiveClass(liveClass),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error updating live class",
    });
  }
};

const deleteLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found",
      });
    }

    if (!canManageLiveClass(req.user, liveClass)) {
      return res.status(403).json({
        success: false,
        message: "You can delete only your own live classes",
      });
    }

    await LiveClass.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Live class deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error deleting live class",
    });
  }
};

const getStudentLiveClasses = async (req, res) => {
  try {
    const studentCourses = await StudentCourses.findOne({
      userId: String(req.user._id),
    });

    const courseIds = (studentCourses?.courses || []).map((course) =>
      String(course.courseId)
    );

    if (!courseIds.length) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const liveClasses = await LiveClass.find({
      courseId: { $in: courseIds },
    }).sort({
      scheduledFor: 1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: liveClasses.map(serializeLiveClass),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error fetching student live classes",
    });
  }
};

module.exports = {
  createLiveClass,
  getInstructorLiveClasses,
  updateLiveClass,
  deleteLiveClass,
  getStudentLiveClasses,
};
