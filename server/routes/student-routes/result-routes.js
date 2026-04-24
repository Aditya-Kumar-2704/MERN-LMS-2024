const express = require("express");
const {
  getStudentPublishedResults,
} = require("../../controllers/result-controller");

const router = express.Router();

router.get("/", getStudentPublishedResults);

module.exports = router;
