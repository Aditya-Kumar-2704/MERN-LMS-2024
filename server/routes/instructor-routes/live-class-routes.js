const express = require("express");
const {
  createLiveClass,
  getInstructorLiveClasses,
  updateLiveClass,
  deleteLiveClass,
} = require("../../controllers/live-class-controller");

const router = express.Router();

router.get("/", getInstructorLiveClasses);
router.post("/", createLiveClass);
router.put("/:id", updateLiveClass);
router.delete("/:id", deleteLiveClass);

module.exports = router;
