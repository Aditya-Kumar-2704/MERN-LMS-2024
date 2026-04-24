const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    selectedOptionId: {
      type: String,
      default: "",
      trim: true,
    },
    selectedOptionText: {
      type: String,
      default: "",
      trim: true,
    },
    correctOptionId: {
      type: String,
      required: true,
      trim: true,
    },
    correctOptionText: {
      type: String,
      required: true,
      trim: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    marksAwarded: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answers: {
      type: [answerSchema],
      default: [],
    },
    correctAnswers: {
      type: Number,
      required: true,
      min: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 0,
    },
    scorePercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    passPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    timeSpentInSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

resultSchema.index({ test: 1, student: 1 }, { unique: true });
resultSchema.index({ student: 1, submittedAt: -1 });

module.exports = mongoose.model("Result", resultSchema);
