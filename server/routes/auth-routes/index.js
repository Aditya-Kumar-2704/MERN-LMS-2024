const express = require("express");
const {
  registerUser,
  loginUser,
  checkAuthUser,
  getProfileUploadSignature,
  updateUserProfile,
} = require("../../controllers/auth-controller/index");
const authenticateMiddleware = require("../../middleware/auth-middleware");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/check-auth", authenticateMiddleware, checkAuthUser);
router.post(
  "/profile-image-sign",
  authenticateMiddleware,
  getProfileUploadSignature
);
router.put("/profile", authenticateMiddleware, updateUserProfile);

module.exports = router;
