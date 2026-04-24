const express = require("express");
const authenticate = require("../../middleware/auth-middleware");
const {
  listExamsForStudentCourse,
  getExamForStudent,
  submitExam,
  getMyLastAttempt,
} = require("../../controllers/exam-controller");
const { getAllToppers } = require("../../controllers/topper-controller");

const router = express.Router();

// Public route for toppers
router.get("/toppers", getAllToppers);

router.use(authenticate);

router.get("/course/:courseId/list", listExamsForStudentCourse);
router.get("/:examId/attempt", getMyLastAttempt);
router.get("/:examId", getExamForStudent);
router.post("/:examId/submit", submitExam);

module.exports = router;
