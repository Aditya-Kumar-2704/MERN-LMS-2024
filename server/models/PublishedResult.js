const mongoose = require("mongoose");

const publishedResultSchema = new mongoose.Schema(
  {
    courseId: { type: String, required: true, index: true },
    courseTitle: { type: String, required: true },
    examId: { type: String, required: true, index: true },
    examTitle: { type: String, required: true },
    userId: { type: String, default: "", index: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true, index: true },
    scorePercent: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    remarks: { type: String, default: "" },
    source: {
      type: String,
      enum: ["manual", "auto"],
      default: "manual",
    },
    attemptCount: { type: Number, default: 1 },
    attemptedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: Date.now, index: true },
    publishedBy: { type: String, required: true },
    publishedByName: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

publishedResultSchema.index({ examId: 1, studentEmail: 1 }, { unique: true });

module.exports = mongoose.model("PublishedResult", publishedResultSchema);
