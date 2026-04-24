const mongoose = require("mongoose");

const topperSchema = new mongoose.Schema(
  {
    rollno: { type: String, required: true },
    year: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true }, // URL or path to image
    marks: { type: Number, required: true }, // Marks/Score achieved
  },
  { timestamps: true }
);

module.exports = mongoose.model("Topper", topperSchema);