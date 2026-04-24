const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    instructions: {
      type: String,
      default: "",
      trim: true,
    },
    durationInMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    passPercentage: {
      type: Number,
      default: 40,
      min: 0,
      max: 100,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true,
      },
    ],
    isPublished: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

testSchema.index({ subject: 1, createdAt: -1 });

module.exports = mongoose.model("Test", testSchema);
