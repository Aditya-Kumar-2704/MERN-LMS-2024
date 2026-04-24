const express = require("express");
const {
  getAllUsers,
  updateUserRole,
  deleteUser,
} = require("../../controllers/admin-controller");
const {
  createExam,
  getExamsByCourseAdmin,
  getExamByIdAdmin,
  updateExam,
  deleteExam,
} = require("../../controllers/exam-controller");
const {
  createTopper,
  getAllToppers,
  updateTopper,
  deleteTopper,
} = require("../../controllers/topper-controller");
const {
  getAutoResultPreview,
  publishResults,
  getPublishedResultsAdmin,
} = require("../../controllers/result-controller");
const {
  getAssessmentSummary,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
} = require("../../controllers/assessment-controller");

const router = express.Router();

router.get("/users", getAllUsers);
router.put("/users/:userId/role", updateUserRole);
router.delete("/users/:userId", deleteUser);

router.post("/exams", createExam);
router.get("/exams/course/:courseId", getExamsByCourseAdmin);
router.get("/exams/:id", getExamByIdAdmin);
router.put("/exams/:id", updateExam);
router.delete("/exams/:id", deleteExam);

router.post("/toppers", createTopper);
router.get("/toppers", getAllToppers);
router.put("/toppers/:id", updateTopper);
router.delete("/toppers/:id", deleteTopper);

router.get("/results/preview/auto", getAutoResultPreview);
router.post("/results/publish", publishResults);
router.get("/results/published", getPublishedResultsAdmin);

router.get("/assessment/summary", getAssessmentSummary);

router.get("/assessment/subjects", getSubjects);
router.post("/assessment/subjects", createSubject);
router.put("/assessment/subjects/:subjectId", updateSubject);
router.delete("/assessment/subjects/:subjectId", deleteSubject);

router.get("/assessment/questions", getQuestions);
router.get("/assessment/questions/:questionId", getQuestionById);
router.post("/assessment/questions", createQuestion);
router.put("/assessment/questions/:questionId", updateQuestion);
router.delete("/assessment/questions/:questionId", deleteQuestion);

router.get("/assessment/tests", getTests);
router.get("/assessment/tests/:testId", getTestById);
router.post("/assessment/tests", createTest);
router.put("/assessment/tests/:testId", updateTest);
router.delete("/assessment/tests/:testId", deleteTest);

module.exports = router;
