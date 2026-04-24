const Exam = require("../../models/Exam");
const ExamAttempt = require("../../models/ExamAttempt");
const StudentCourses = require("../../models/StudentCourses");

async function userOwnsCourse(userId, courseId) {
  const record = await StudentCourses.findOne({ userId: String(userId) });
  if (!record?.courses?.length) return false;
  return record.courses.some((c) => String(c.courseId) === String(courseId));
}

function validateQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return "At least one question is required";
  }
  for (const q of questions) {
    if (!q.prompt || typeof q.prompt !== "string") {
      return "Each question needs a prompt";
    }
    if (!Array.isArray(q.options) || q.options.length < 2) {
      return "Each question needs at least two options";
    }
    if (
      typeof q.correctIndex !== "number" ||
      q.correctIndex < 0 ||
      q.correctIndex >= q.options.length
    ) {
      return "Each question needs a valid correctIndex";
    }
  }
  return null;
}

const createExam = async (req, res) => {
  try {
    const { courseId, title, description, passingScorePercent, timeLimitPerQuestion, questions } =
      req.body;

    if (!courseId || !title) {
      return res.status(400).json({
        success: false,
        message: "courseId and title are required",
      });
    }

    const errMsg = validateQuestions(questions);
    if (errMsg) {
      return res.status(400).json({ success: false, message: errMsg });
    }

    const exam = new Exam({
      courseId: String(courseId),
      title,
      description: description || "",
      passingScorePercent:
        typeof passingScorePercent === "number" ? passingScorePercent : 60,
      timeLimitPerQuestion: typeof timeLimitPerQuestion === "number" ? timeLimitPerQuestion : 60,
      questions,
    });

    await exam.save();

    res.status(201).json({
      success: true,
      message: "Exam created",
      data: exam,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Error creating exam" });
  }
};

const getExamsByCourseAdmin = async (req, res) => {
  try {
    const { courseId } = req.params;
    const exams = await Exam.find({ courseId: String(courseId) }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, data: exams });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Error fetching exams" });
  }
};

const getExamByIdAdmin = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }
    res.status(200).json({ success: true, data: exam });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Error fetching exam" });
  }
};

const updateExam = async (req, res) => {
  try {
    const { title, description, passingScorePercent, timeLimitPerQuestion, questions } = req.body;

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    if (questions) {
      const errMsg = validateQuestions(questions);
      if (errMsg) {
        return res.status(400).json({ success: false, message: errMsg });
      }
      exam.questions = questions;
    }
    if (title !== undefined) exam.title = title;
    if (description !== undefined) exam.description = description;
    if (typeof passingScorePercent === "number") {
      exam.passingScorePercent = passingScorePercent;
    }
    if (typeof timeLimitPerQuestion === "number") {
      exam.timeLimitPerQuestion = timeLimitPerQuestion;
    }

    await exam.save();

    res.status(200).json({
      success: true,
      message: "Exam updated",
      data: exam,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Error updating exam" });
  }
};

const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }
    await ExamAttempt.deleteMany({ examId: String(exam._id) });
    res.status(200).json({ success: true, message: "Exam deleted" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Error deleting exam" });
  }
};

const listExamsForStudentCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = String(req.user._id);

    const owns = await userOwnsCourse(userId, courseId);
    if (!owns) {
      return res.status(403).json({
        success: false,
        message: "Purchase this course to access exams",
      });
    }

    const exams = await Exam.find({ courseId: String(courseId) })
      .select("title description passingScorePercent createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const withIds = exams.map((e) => ({
      _id: e._id,
      title: e.title,
      description: e.description,
      passingScorePercent: e.passingScorePercent,
      createdAt: e.createdAt,
    }));

    res.status(200).json({ success: true, data: withIds });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Error listing exams" });
  }
};

const getExamForStudent = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    const userId = String(req.user._id);
    const owns = await userOwnsCourse(userId, exam.courseId);
    if (!owns) {
      return res.status(403).json({
        success: false,
        message: "Purchase this course to take the exam",
      });
    }

    const questions = exam.questions.map((q) => ({
      prompt: q.prompt,
      options: q.options,
    }));

    res.status(200).json({
      success: true,
      data: {
        _id: exam._id,
        title: exam.title,
        description: exam.description,
        passingScorePercent: exam.passingScorePercent,
        timeLimitPerQuestion: exam.timeLimitPerQuestion,
        questions,
      },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Error loading exam" });
  }
};

const submitExam = async (req, res) => {
  try {
    const { answers } = req.body;
    const exam = await Exam.findById(req.params.examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    const userId = String(req.user._id);
    const owns = await userOwnsCourse(userId, exam.courseId);
    if (!owns) {
      return res.status(403).json({
        success: false,
        message: "Purchase this course to submit the exam",
      });
    }

    if (!Array.isArray(answers) || answers.length !== exam.questions.length) {
      return res.status(400).json({
        success: false,
        message: "Submit an answer index for each question",
      });
    }

    let correct = 0;
    exam.questions.forEach((q, i) => {
      if (Number(answers[i]) === q.correctIndex) correct += 1;
    });

    const scorePercent = Math.round((correct / exam.questions.length) * 100);
    const passed = scorePercent >= exam.passingScorePercent;

    const attempt = new ExamAttempt({
      examId: String(exam._id),
      courseId: String(exam.courseId),
      userId,
      answers: answers.map((a) => Number(a)),
      scorePercent,
      passed,
    });
    await attempt.save();

    res.status(200).json({
      success: true,
      message: passed ? "Passed" : "Not passed",
      data: {
        scorePercent,
        passed,
        passingScorePercent: exam.passingScorePercent,
        correctCount: correct,
        totalQuestions: exam.questions.length,
      },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Error submitting exam" });
  }
};

const getMyLastAttempt = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    const userId = String(req.user._id);
    const owns = await userOwnsCourse(userId, exam.courseId);
    if (!owns) {
      return res.status(403).json({
        success: false,
        message: "Purchase required",
      });
    }

    const last = await ExamAttempt.findOne({
      examId: String(exam._id),
      userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: last || null });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Error loading attempt" });
  }
};

module.exports = {
  createExam,
  getExamsByCourseAdmin,
  getExamByIdAdmin,
  updateExam,
  deleteExam,
  listExamsForStudentCourse,
  getExamForStudent,
  submitExam,
  getMyLastAttempt,
};
