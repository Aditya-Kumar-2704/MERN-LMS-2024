const Topper = require("../models/Topper");

const createTopper = async (req, res) => {
  try {
    const { rollno, year, name, image, marks } = req.body;

    if (!rollno || !year || !name || !image || !marks) {
      return res.status(400).json({
        success: false,
        message: "All fields including marks are required",
      });
    }

    const topper = new Topper({ rollno, year, name, image, marks });
    await topper.save();

    res.status(201).json({
      success: true,
      message: "Topper added successfully",
      data: topper,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Error adding topper" });
  }
};

const getAllToppers = async (req, res) => {
  try {
    const toppers = await Topper.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: toppers });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Error fetching toppers" });
  }
};

const updateTopper = async (req, res) => {
  try {
    const { rollno, year, name, image, marks } = req.body;

    const topper = await Topper.findById(req.params.id);
    if (!topper) {
      return res.status(404).json({
        success: false,
        message: "Topper not found",
      });
    }

    if (rollno !== undefined) topper.rollno = rollno;
    if (year !== undefined) topper.year = year;
    if (name !== undefined) topper.name = name;
    if (image !== undefined) topper.image = image;
    if (marks !== undefined) topper.marks = marks;

    await topper.save();

    res.status(200).json({
      success: true,
      message: "Topper updated",
      data: topper,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Error updating topper" });
  }
};

const deleteTopper = async (req, res) => {
  try {
    const topper = await Topper.findByIdAndDelete(req.params.id);
    if (!topper) {
      return res.status(404).json({
        success: false,
        message: "Topper not found",
      });
    }
    res.status(200).json({ success: true, message: "Topper deleted" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Error deleting topper" });
  }
};

module.exports = {
  createTopper,
  getAllToppers,
  updateTopper,
  deleteTopper,
};