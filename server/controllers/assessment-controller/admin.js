const Subject = require("../../models/Subject");
const Question = require("../../models/Question");
const Test = require("../../models/Test");
const Result = require("../../models/Result");
const {
  buildQuestionPayload,
  validateSubjectExists,
  validateQuestionIds,
  formatSubject,
  formatQuestionForAdmin,
  formatTestForAdmin,
} = require("./utils");

async function getAssessmentSummary(req, res) {
  try {
    const [subjectCount, questionCount, testCount, resultCount, publishedTests] =
      await Promise.all([
        Subject.countDocuments(),
        Question.countDocuments(),
        Test.countDocuments(),
        Result.countDocuments(),
        Test.find({ isPublished: true })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("subject", "name code")
          .populate("questions", "questionText marks"),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        subjectCount,
        questionCount,
        testCount,
        resultCount,
        publishedTests: publishedTests.map(formatTestForAdmin),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error loading assessment summary",
    });
  }
}

async function getSubjects(req, res) {
  try {
    const [subjects, testCounts] = await Promise.all([
      Subject.find({}).sort({ name: 1 }),
      Test.aggregate([
        {
          $group: {
            _id: "$subject",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const countsMap = new Map(
      testCounts.map((item) => [String(item._id), item.count])
    );

    return res.status(200).json({
      success: true,
      data: subjects.map((subject) =>
        formatSubject(subject, countsMap.get(String(subject._id)) || 0)
      ),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error loading subjects",
    });
  }
}

async function createSubject(req, res) {
  try {
    const name = String(req.body.name || "").trim();
    const code = String(req.body.code || "").trim().toUpperCase();
    const description = String(req.body.description || "").trim();

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Subject name and code are required",
      });
    }

    const existingSubject = await Subject.findOne({
      $or: [{ name }, { code }],
    });

    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: "A subject with the same name or code already exists",
      });
    }

    const subject = await Subject.create({
      name,
      code,
      description,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: formatSubject(subject),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error creating subject",
    });
  }
}

async function updateSubject(req, res) {
  try {
    const subjectId = req.params.subjectId;
    const name = String(req.body.name || "").trim();
    const code = String(req.body.code || "").trim().toUpperCase();
    const description = String(req.body.description || "").trim();
    const isActive =
      typeof req.body.isActive === "boolean" ? req.body.isActive : true;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Subject name and code are required",
      });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    const existingSubject = await Subject.findOne({
      _id: { $ne: subjectId },
      $or: [{ name }, { code }],
    });

    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: "A subject with the same name or code already exists",
      });
    }

    subject.name = name;
    subject.code = code;
    subject.description = description;
    subject.isActive = isActive;
    await subject.save();

    return res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: formatSubject(subject),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error updating subject",
    });
  }
}

async function deleteSubject(req, res) {
  try {
    const subjectId = req.params.subjectId;
    const subject = await Subject.findById(subjectId);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    const tests = await Test.find({ subject: subjectId }).select("_id");
    const testIds = tests.map((test) => test._id);

    await Result.deleteMany({ test: { $in: testIds } });
    await Test.deleteMany({ subject: subjectId });
    await Question.deleteMany({ subject: subjectId });
    await Subject.findByIdAndDelete(subjectId);

    return res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error deleting subject",
    });
  }
}

async function getQuestions(req, res) {
  try {
    const subjectFilter = String(req.query.subject || "").trim();
    const query = {};

    if (subjectFilter) {
      query.subject = subjectFilter;
    }

    const questions = await Question.find(query)
      .populate("subject", "name code")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: questions.map(formatQuestionForAdmin),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error loading questions",
    });
  }
}

async function getQuestionById(req, res) {
  try {
    const question = await Question.findById(req.params.questionId).populate(
      "subject",
      "name code"
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: formatQuestionForAdmin(question),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error loading question",
    });
  }
}

async function createQuestion(req, res) {
  try {
    const payload = buildQuestionPayload(req.body);
    await validateSubjectExists(payload.subject);

    const question = await Question.create({
      ...payload,
      createdBy: req.user._id,
    });

    const populatedQuestion = await Question.findById(question._id).populate(
      "subject",
      "name code"
    );

    return res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: formatQuestionForAdmin(populatedQuestion),
    });
  } catch (error) {
    console.log(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error creating question",
    });
  }
}

async function updateQuestion(req, res) {
  try {
    const question = await Question.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    const payload = buildQuestionPayload(req.body);
    await validateSubjectExists(payload.subject);

    question.subject = payload.subject;
    question.questionText = payload.questionText;
    question.options = payload.options;
    question.correctOptionId = payload.correctOptionId;
    question.marks = payload.marks;
    question.isActive =
      typeof req.body.isActive === "boolean" ? req.body.isActive : question.isActive;

    await question.save();

    const populatedQuestion = await Question.findById(question._id).populate(
      "subject",
      "name code"
    );

    return res.status(200).json({
      success: true,
      message: "Question updated successfully",
      data: formatQuestionForAdmin(populatedQuestion),
    });
  } catch (error) {
    console.log(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error updating question",
    });
  }
}

async function deleteQuestion(req, res) {
  try {
    const question = await Question.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    await Question.findByIdAndDelete(req.params.questionId);
    await Test.updateMany(
      { questions: question._id },
      { $pull: { questions: question._id } }
    );

    return res.status(200).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error deleting question",
    });
  }
}

async function getTests(req, res) {
  try {
    const subjectFilter = String(req.query.subject || "").trim();
    const query = {};

    if (subjectFilter) {
      query.subject = subjectFilter;
    }

    const tests = await Test.find(query)
      .populate("subject", "name code")
      .populate("questions", "questionText marks")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: tests.map(formatTestForAdmin),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error loading tests",
    });
  }
}

async function getTestById(req, res) {
  try {
    const test = await Test.findById(req.params.testId)
      .populate("subject", "name code")
      .populate("questions", "questionText marks");

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: formatTestForAdmin(test),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error loading test",
    });
  }
}

async function createTest(req, res) {
  try {
    const subjectId = String(req.body.subject || req.body.subjectId || "").trim();
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    const instructions = String(req.body.instructions || "").trim();
    const durationInMinutes = Number(req.body.durationInMinutes);
    const passPercentage = Number(req.body.passPercentage);
    const isPublished =
      typeof req.body.isPublished === "boolean" ? req.body.isPublished : true;

    if (!title || !subjectId || Number.isNaN(durationInMinutes)) {
      return res.status(400).json({
        success: false,
        message: "Subject, title, and timer are required",
      });
    }

    const subject = await validateSubjectExists(subjectId);
    const questionIds = await validateQuestionIds(req.body.questions, subject._id);

    const test = await Test.create({
      subject: subject._id,
      title,
      description,
      instructions,
      durationInMinutes,
      passPercentage:
        !Number.isNaN(passPercentage) && passPercentage >= 0 && passPercentage <= 100
          ? passPercentage
          : 40,
      questions: questionIds,
      isPublished,
      createdBy: req.user._id,
    });

    const populatedTest = await Test.findById(test._id)
      .populate("subject", "name code")
      .populate("questions", "questionText marks");

    return res.status(201).json({
      success: true,
      message: "Test created successfully",
      data: formatTestForAdmin(populatedTest),
    });
  } catch (error) {
    console.log(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error creating test",
    });
  }
}

async function updateTest(req, res) {
  try {
    const test = await Test.findById(req.params.testId);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    const subjectId = String(req.body.subject || req.body.subjectId || "").trim();
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    const instructions = String(req.body.instructions || "").trim();
    const durationInMinutes = Number(req.body.durationInMinutes);
    const passPercentage = Number(req.body.passPercentage);

    if (!title || !subjectId || Number.isNaN(durationInMinutes)) {
      return res.status(400).json({
        success: false,
        message: "Subject, title, and timer are required",
      });
    }

    const subject = await validateSubjectExists(subjectId);
    const questionIds = await validateQuestionIds(req.body.questions, subject._id);

    test.subject = subject._id;
    test.title = title;
    test.description = description;
    test.instructions = instructions;
    test.durationInMinutes = durationInMinutes;
    test.passPercentage =
      !Number.isNaN(passPercentage) && passPercentage >= 0 && passPercentage <= 100
        ? passPercentage
        : test.passPercentage;
    test.questions = questionIds;
    test.isPublished =
      typeof req.body.isPublished === "boolean"
        ? req.body.isPublished
        : test.isPublished;

    await test.save();

    const populatedTest = await Test.findById(test._id)
      .populate("subject", "name code")
      .populate("questions", "questionText marks");

    return res.status(200).json({
      success: true,
      message: "Test updated successfully",
      data: formatTestForAdmin(populatedTest),
    });
  } catch (error) {
    console.log(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error updating test",
    });
  }
}

async function deleteTest(req, res) {
  try {
    const test = await Test.findById(req.params.testId);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    await Result.deleteMany({ test: test._id });
    await Test.findByIdAndDelete(test._id);

    return res.status(200).json({
      success: true,
      message: "Test deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error deleting test",
    });
  }
}

module.exports = {
  getAssessmentSummary,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
};
