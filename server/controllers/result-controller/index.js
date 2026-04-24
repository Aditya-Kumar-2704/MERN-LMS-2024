const Course = require("../../models/Course");
const Exam = require("../../models/Exam");
const ExamAttempt = require("../../models/ExamAttempt");
const PublishedResult = require("../../models/PublishedResult");
const User = require("../../models/User");

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return null;
  return Math.max(0, Math.min(100, score));
}

async function loadExamWithCourse(examId) {
  const exam = await Exam.findById(examId).lean();
  if (!exam) {
    return {
      error: {
        status: 404,
        message: "Exam not found",
      },
    };
  }

  const course = await Course.findById(exam.courseId).lean();
  if (!course) {
    return {
      error: {
        status: 404,
        message: "Course not found for this exam",
      },
    };
  }

  return { exam, course };
}

async function buildAutoPreview(examId, mode) {
  const attempts = await ExamAttempt.find({ examId: String(examId) }).lean();

  if (!attempts.length) {
    return [];
  }

  const attemptCountByUser = attempts.reduce((acc, attempt) => {
    acc[attempt.userId] = (acc[attempt.userId] || 0) + 1;
    return acc;
  }, {});

  const orderedAttempts = [...attempts].sort((a, b) => {
    if (mode === "best") {
      if (b.scorePercent !== a.scorePercent) {
        return b.scorePercent - a.scorePercent;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    }

    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const selectedAttempts = new Map();
  for (const attempt of orderedAttempts) {
    if (!selectedAttempts.has(attempt.userId)) {
      selectedAttempts.set(attempt.userId, attempt);
    }
  }

  const userIds = Array.from(selectedAttempts.keys());
  const users = await User.find({ _id: { $in: userIds } })
    .select("userName userEmail")
    .lean();
  const userMap = new Map(users.map((user) => [String(user._id), user]));

  return Array.from(selectedAttempts.values())
    .map((attempt) => {
      const user = userMap.get(String(attempt.userId));
      return {
        userId: String(attempt.userId),
        studentName:
          user?.userName || `Student ${String(attempt.userId).slice(-6)}`,
        studentEmail: user?.userEmail || "",
        scorePercent: attempt.scorePercent,
        passed: Boolean(attempt.passed),
        remarks: "",
        attemptCount: attemptCountByUser[attempt.userId] || 1,
        attemptedAt: attempt.createdAt || null,
      };
    })
    .sort((a, b) => {
      if (b.scorePercent !== a.scorePercent) {
        return b.scorePercent - a.scorePercent;
      }
      return a.studentName.localeCompare(b.studentName);
    });
}

const getAutoResultPreview = async (req, res) => {
  try {
    const { examId, mode = "best" } = req.query;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "examId is required",
      });
    }

    const calculationMode = mode === "latest" ? "latest" : "best";
    const { exam, course, error } = await loadExamWithCourse(examId);

    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    const results = await buildAutoPreview(exam._id, calculationMode);

    return res.status(200).json({
      success: true,
      data: {
        course: {
          _id: course._id,
          title: course.title,
        },
        exam: {
          _id: exam._id,
          title: exam.title,
          passingScorePercent: exam.passingScorePercent,
        },
        mode: calculationMode,
        results,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error generating result preview",
    });
  }
};

const publishResults = async (req, res) => {
  try {
    const { examId, source = "manual", results } = req.body;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "examId is required",
      });
    }

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one result row is required",
      });
    }

    const { exam, course, error } = await loadExamWithCourse(examId);

    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    const normalizedRows = [];
    const rowByEmail = new Map();

    for (const row of results) {
      const studentEmail = normalizeEmail(row.studentEmail);
      const studentName = String(row.studentName || "").trim();
      const scorePercent = normalizeScore(row.scorePercent);

      if (!studentEmail || !studentName || scorePercent === null) {
        return res.status(400).json({
          success: false,
          message:
            "Each result row needs studentName, studentEmail and numeric scorePercent",
        });
      }

      const normalizedRow = {
        userId: row.userId ? String(row.userId) : "",
        studentName,
        studentEmail,
        scorePercent,
        passed:
          typeof row.passed === "boolean"
            ? row.passed
            : scorePercent >= Number(exam.passingScorePercent || 0),
        remarks: String(row.remarks || "").trim(),
        attemptCount:
          Number.isFinite(Number(row.attemptCount)) && Number(row.attemptCount) > 0
            ? Number(row.attemptCount)
            : 1,
        attemptedAt: row.attemptedAt || null,
      };

      rowByEmail.set(studentEmail, normalizedRow);
    }

    normalizedRows.push(...rowByEmail.values());

    const emailList = normalizedRows.map((row) => row.studentEmail);
    const users = await User.find({ userEmail: { $in: emailList } })
      .select("_id userName userEmail")
      .lean();
    const userByEmail = new Map(
      users.map((user) => [normalizeEmail(user.userEmail), user])
    );

    const publishedDocs = [];
    for (const row of normalizedRows) {
      const matchedUser = userByEmail.get(row.studentEmail);
      const doc = await PublishedResult.findOneAndUpdate(
        {
          examId: String(exam._id),
          studentEmail: row.studentEmail,
        },
        {
          $set: {
            courseId: String(course._id),
            courseTitle: course.title,
            examId: String(exam._id),
            examTitle: exam.title,
            userId: row.userId || String(matchedUser?._id || ""),
            studentName: row.studentName || matchedUser?.userName || "",
            studentEmail: row.studentEmail,
            scorePercent: row.scorePercent,
            passed: row.passed,
            remarks: row.remarks,
            source: source === "auto" ? "auto" : "manual",
            attemptCount: row.attemptCount,
            attemptedAt: row.attemptedAt || null,
            publishedAt: new Date(),
            publishedBy: String(req.user._id),
            publishedByName: req.user.userName,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      publishedDocs.push(doc);
    }

    return res.status(200).json({
      success: true,
      message: "Results published successfully",
      data: {
        count: publishedDocs.length,
        results: publishedDocs,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error publishing results",
    });
  }
};

const getPublishedResultsAdmin = async (req, res) => {
  try {
    const query = {};

    if (req.query.courseId) {
      query.courseId = String(req.query.courseId);
    }

    if (req.query.examId) {
      query.examId = String(req.query.examId);
    }

    const results = await PublishedResult.find(query)
      .sort({ scorePercent: -1, studentName: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error fetching published results",
    });
  }
};

const getStudentPublishedResults = async (req, res) => {
  try {
    const query = {
      $or: [
        { userId: String(req.user._id) },
        { studentEmail: normalizeEmail(req.user.userEmail) },
      ],
    };

    if (req.query.courseId) {
      query.courseId = String(req.query.courseId);
    }

    const results = await PublishedResult.find(query)
      .sort({ publishedAt: -1, scorePercent: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error fetching student results",
    });
  }
};

module.exports = {
  getAutoResultPreview,
  publishResults,
  getPublishedResultsAdmin,
  getStudentPublishedResults,
};
