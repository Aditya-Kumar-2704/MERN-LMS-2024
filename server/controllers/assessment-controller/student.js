const mongoose = require("mongoose");
const Test = require("../../models/Test");
const Result = require("../../models/Result");
const Subject = require("../../models/Subject");
const { shuffleArray } = require("../../helpers/assessment");
const { formatSubject, formatResult } = require("./utils");

async function getStudentDashboard(req, res) {
  try {
    const [subjects, tests, results] = await Promise.all([
      Subject.find({ isActive: true }).sort({ name: 1 }),
      Test.find({ isPublished: true })
        .populate("subject", "name code")
        .populate("questions", "_id")
        .sort({ createdAt: -1 }),
      Result.find({ student: req.user._id })
        .populate("test", "title description durationInMinutes")
        .populate("subject", "name code")
        .sort({ submittedAt: -1 }),
    ]);

    const resultMap = new Map(
      results.map((result) => [String(result.test._id), result])
    );
    const testCountBySubject = new Map();

    tests.forEach((test) => {
      const currentCount = testCountBySubject.get(String(test.subject._id)) || 0;
      testCountBySubject.set(String(test.subject._id), currentCount + 1);
    });

    return res.status(200).json({
      success: true,
      data: {
        subjects: subjects.map((subject) =>
          formatSubject(subject, testCountBySubject.get(String(subject._id)) || 0)
        ),
        tests: tests.map((test) => {
          const existingResult = resultMap.get(String(test._id));
          return {
            _id: String(test._id),
            title: test.title,
            description: test.description || "",
            durationInMinutes: test.durationInMinutes,
            passPercentage: test.passPercentage,
            subject: {
              _id: String(test.subject._id),
              name: test.subject.name,
              code: test.subject.code,
            },
            totalQuestions: (test.questions || []).length,
            attempted: Boolean(existingResult),
            resultId: existingResult ? String(existingResult._id) : "",
            scorePercentage: existingResult?.scorePercentage ?? null,
            submittedAt: existingResult?.submittedAt ?? null,
          };
        }),
        recentResults: results.slice(0, 6).map(formatResult),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error loading student dashboard",
    });
  }
}

async function getStudentTests(req, res) {
  try {
    const subjectFilter = String(req.query.subject || "").trim();
    const query = { isPublished: true };

    if (subjectFilter) {
      query.subject = subjectFilter;
    }

    const [tests, results] = await Promise.all([
      Test.find(query)
        .populate("subject", "name code")
        .populate("questions", "_id")
        .sort({ createdAt: -1 }),
      Result.find({ student: req.user._id }).select("test scorePercentage submittedAt"),
    ]);

    const resultMap = new Map(
      results.map((result) => [
        String(result.test),
        {
          scorePercentage: result.scorePercentage,
          submittedAt: result.submittedAt,
        },
      ])
    );

    return res.status(200).json({
      success: true,
      data: tests.map((test) => ({
        _id: String(test._id),
        title: test.title,
        description: test.description || "",
        durationInMinutes: test.durationInMinutes,
        passPercentage: test.passPercentage,
        totalQuestions: (test.questions || []).length,
        subject: {
          _id: String(test.subject._id),
          name: test.subject.name,
          code: test.subject.code,
        },
        attempted: resultMap.has(String(test._id)),
        scorePercentage: resultMap.get(String(test._id))?.scorePercentage ?? null,
        submittedAt: resultMap.get(String(test._id))?.submittedAt ?? null,
      })),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error loading tests",
    });
  }
}

async function getStudentTestById(req, res) {
  try {
    const test = await Test.findOne({
      _id: req.params.testId,
      isPublished: true,
    })
      .populate("subject", "name code")
      .populate("questions");

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    if (!test.questions?.length) {
      return res.status(400).json({
        success: false,
        message: "This test does not have any questions right now",
      });
    }

    const existingResult = await Result.findOne({
      test: test._id,
      student: req.user._id,
    });

    if (existingResult) {
      return res.status(200).json({
        success: true,
        data: {
          alreadySubmitted: true,
          resultId: String(existingResult._id),
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: String(test._id),
        title: test.title,
        description: test.description || "",
        instructions: test.instructions || "",
        durationInMinutes: test.durationInMinutes,
        passPercentage: test.passPercentage,
        subject: {
          _id: String(test.subject._id),
          name: test.subject.name,
          code: test.subject.code,
        },
        questions: shuffleArray(test.questions).map((question) => ({
          _id: String(question._id),
          questionText: question.questionText,
          marks: question.marks,
          options: shuffleArray(question.options).map((option) => ({
            optionId: option.optionId,
            text: option.text,
          })),
        })),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error loading test",
    });
  }
}

async function submitStudentTest(req, res) {
  try {
    const test = await Test.findOne({
      _id: req.params.testId,
      isPublished: true,
    }).populate("questions");

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    const existingResult = await Result.findOne({
      test: test._id,
      student: req.user._id,
    });

    if (existingResult) {
      return res.status(409).json({
        success: false,
        message: "This test has already been submitted",
        data: {
          resultId: String(existingResult._id),
        },
      });
    }

    const submittedAnswers = Array.isArray(req.body.answers) ? req.body.answers : [];
    const answerMap = new Map(
      submittedAnswers
        .filter(
          (answer) =>
            mongoose.Types.ObjectId.isValid(answer?.questionId) &&
            typeof answer?.optionId === "string"
        )
        .map((answer) => [String(answer.questionId), String(answer.optionId)])
    );

    let correctAnswers = 0;

    const answers = test.questions.map((question) => {
      const selectedOptionId = answerMap.get(String(question._id)) || "";
      const selectedOption = question.options.find(
        (option) => option.optionId === selectedOptionId
      );
      const correctOption = question.options.find(
        (option) => option.optionId === question.correctOptionId
      );
      const isCorrect = selectedOptionId === question.correctOptionId;

      if (isCorrect) {
        correctAnswers += 1;
      }

      return {
        question: question._id,
        questionText: question.questionText,
        selectedOptionId,
        selectedOptionText: selectedOption?.text || "",
        correctOptionId: question.correctOptionId,
        correctOptionText: correctOption?.text || "",
        isCorrect,
        marksAwarded: isCorrect ? question.marks : 0,
      };
    });

    const totalQuestions = test.questions.length;
    const scorePercentage =
      totalQuestions === 0 ? 0 : Math.round((correctAnswers / totalQuestions) * 100);
    const passPercentage = test.passPercentage || 40;

    const result = await Result.create({
      test: test._id,
      subject: test.subject,
      student: req.user._id,
      answers,
      correctAnswers,
      totalQuestions,
      scorePercentage,
      passPercentage,
      passed: scorePercentage >= passPercentage,
      timeSpentInSeconds:
        Number(req.body.timeSpentInSeconds) > 0
          ? Number(req.body.timeSpentInSeconds)
          : 0,
    });

    const populatedResult = await Result.findById(result._id)
      .populate("test", "title description durationInMinutes")
      .populate("subject", "name code");

    return res.status(201).json({
      success: true,
      message: "Test submitted successfully",
      data: {
        resultId: String(result._id),
        ...formatResult(populatedResult),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error submitting test",
    });
  }
}

async function getStudentResults(req, res) {
  try {
    const results = await Result.find({ student: req.user._id })
      .populate("test", "title description durationInMinutes")
      .populate("subject", "name code")
      .sort({ submittedAt: -1 });

    return res.status(200).json({
      success: true,
      data: results.map(formatResult),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error loading results",
    });
  }
}

async function getStudentResultById(req, res) {
  try {
    const result = await Result.findOne({
      _id: req.params.resultId,
      student: req.user._id,
    })
      .populate("test", "title description durationInMinutes")
      .populate("subject", "name code");

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: formatResult(result),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error loading result",
    });
  }
}

module.exports = {
  getStudentDashboard,
  getStudentTests,
  getStudentTestById,
  submitStudentTest,
  getStudentResults,
  getStudentResultById,
};
