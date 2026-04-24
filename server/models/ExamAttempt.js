const mongoose = require("mongoose");

const examAttemptSchema = new mongoose.Schema(
  {
    examId: { type: String, required: true },
    courseId: { type: String, required: true },
    userId: { type: String, required: true },
    answers: [{ type: Number }],
    scorePercent: { type: Number, required: true },
    passed: { type: Boolean, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExamAttempt", examAttemptSchema);
