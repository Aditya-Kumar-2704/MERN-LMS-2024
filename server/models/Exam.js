const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctIndex: { type: Number, required: true },
  },
  { _id: false }
);

const examSchema = new mongoose.Schema(
  {
    courseId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    passingScorePercent: { type: Number, default: 60 },
    timeLimitPerQuestion: { type: Number, default: 60 }, // in seconds
    questions: {
      type: [questionSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "At least one question is required",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exam", examSchema);
