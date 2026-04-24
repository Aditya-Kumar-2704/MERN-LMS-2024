const express = require("express");
const authenticate = require("../../middleware/auth-middleware");
const { requireStudent } = require("../../middleware/role-middleware");
const {
  getStudentDashboard,
  getStudentTests,
  getStudentTestById,
  submitStudentTest,
  getStudentResults,
  getStudentResultById,
} = require("../../controllers/assessment-controller");

const router = express.Router();

router.use(authenticate, requireStudent);

router.get("/dashboard", getStudentDashboard);
router.get("/tests", getStudentTests);
router.get("/tests/:testId", getStudentTestById);
router.post("/tests/:testId/submit", submitStudentTest);
router.get("/results", getStudentResults);
router.get("/results/:resultId", getStudentResultById);

module.exports = router;
