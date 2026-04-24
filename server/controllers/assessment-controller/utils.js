const mongoose = require("mongoose");
const Subject = require("../../models/Subject");
const Question = require("../../models/Question");

function createValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function buildOptionObjects(options) {
  const normalizedOptions = (Array.isArray(options) ? options : [])
    .map((option) =>
      typeof option === "string"
        ? String(option || "").trim()
        : String(option?.text || "").trim()
    )
    .filter(Boolean);

  if (normalizedOptions.length < 2) {
    throw createValidationError("Add at least two options for every question");
  }

  return normalizedOptions.map((text) => ({
    optionId: new mongoose.Types.ObjectId().toString(),
    text,
  }));
}

function buildQuestionPayload(body) {
  const subject = String(body.subject || body.subjectId || "").trim();
  const questionText = String(body.questionText || "").trim();
  const correctOptionIndex = Number(body.correctOptionIndex);
  const marks = Number(body.marks) > 0 ? Number(body.marks) : 1;

  if (!subject) {
    throw createValidationError("Subject is required");
  }

  if (!questionText) {
    throw createValidationError("Question text is required");
  }

  const options = buildOptionObjects(body.options);

  if (
    Number.isNaN(correctOptionIndex) ||
    correctOptionIndex < 0 ||
    correctOptionIndex >= options.length
  ) {
    throw createValidationError("Select a valid correct option");
  }

  return {
    subject,
    questionText,
    options,
    correctOptionId: options[correctOptionIndex].optionId,
    marks,
  };
}

async function validateSubjectExists(subjectId) {
  if (!mongoose.Types.ObjectId.isValid(subjectId)) {
    throw createValidationError("Invalid subject");
  }

  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw createValidationError("Subject not found");
  }

  return subject;
}

async function validateQuestionIds(questionIds, subjectId) {
  const normalizedQuestionIds = [
    ...new Set((Array.isArray(questionIds) ? questionIds : []).map(String)),
  ].filter((value) => mongoose.Types.ObjectId.isValid(value));

  if (normalizedQuestionIds.length === 0) {
    throw createValidationError("Select at least one question for the test");
  }

  const questions = await Question.find({
    _id: { $in: normalizedQuestionIds },
    subject: subjectId,
  }).select("_id");

  if (questions.length !== normalizedQuestionIds.length) {
    throw createValidationError(
      "Every selected question must belong to the selected subject"
    );
  }

  return normalizedQuestionIds;
}

function formatSubject(subject, testCount = 0) {
  return {
    _id: String(subject._id),
    name: subject.name,
    code: subject.code,
    description: subject.description || "",
    isActive: subject.isActive,
    testCount,
    createdAt: subject.createdAt,
  };
}

function formatQuestionForAdmin(question) {
  const correctOptionIndex = question.options.findIndex(
    (option) => option.optionId === question.correctOptionId
  );

  return {
    _id: String(question._id),
    subject: question.subject?._id
      ? {
          _id: String(question.subject._id),
          name: question.subject.name,
          code: question.subject.code,
        }
      : question.subject,
    questionText: question.questionText,
    options: question.options.map((option) => option.text),
    correctOptionIndex: correctOptionIndex >= 0 ? correctOptionIndex : 0,
    marks: question.marks,
    isActive: question.isActive,
    createdAt: question.createdAt,
  };
}

function formatTestForAdmin(test) {
  return {
    _id: String(test._id),
    title: test.title,
    description: test.description || "",
    instructions: test.instructions || "",
    durationInMinutes: test.durationInMinutes,
    passPercentage: test.passPercentage,
    isPublished: test.isPublished,
    createdAt: test.createdAt,
    subject: test.subject?._id
      ? {
          _id: String(test.subject._id),
          name: test.subject.name,
          code: test.subject.code,
        }
      : test.subject,
    questions: (test.questions || []).map((question) =>
      typeof question === "object" && question._id
        ? {
            _id: String(question._id),
            questionText: question.questionText,
            marks: question.marks,
          }
        : String(question)
    ),
    questionCount: (test.questions || []).length,
  };
}

function formatResult(result) {
  return {
    _id: String(result._id),
    submittedAt: result.submittedAt,
    scorePercentage: result.scorePercentage,
    correctAnswers: result.correctAnswers,
    totalQuestions: result.totalQuestions,
    passPercentage: result.passPercentage,
    passed: result.passed,
    timeSpentInSeconds: result.timeSpentInSeconds,
    subject: result.subject?._id
      ? {
          _id: String(result.subject._id),
          name: result.subject.name,
          code: result.subject.code,
        }
      : result.subject,
    test: result.test?._id
      ? {
          _id: String(result.test._id),
          title: result.test.title,
          description: result.test.description || "",
          durationInMinutes: result.test.durationInMinutes,
        }
      : result.test,
    answers: (result.answers || []).map((answer) => ({
      questionId: String(answer.question),
      questionText: answer.questionText,
      selectedOptionId: answer.selectedOptionId || "",
      selectedOptionText: answer.selectedOptionText || "",
      correctOptionId: answer.correctOptionId,
      correctOptionText: answer.correctOptionText,
      isCorrect: answer.isCorrect,
      marksAwarded: answer.marksAwarded,
    })),
  };
}

module.exports = {
  createValidationError,
  buildQuestionPayload,
  validateSubjectExists,
  validateQuestionIds,
  formatSubject,
  formatQuestionForAdmin,
  formatTestForAdmin,
  formatResult,
};
