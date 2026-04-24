const express = require("express");
const {
  getStudentLiveClasses,
} = require("../../controllers/live-class-controller");

const router = express.Router();

router.get("/", getStudentLiveClasses);

module.exports = router;
