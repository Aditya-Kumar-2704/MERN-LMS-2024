const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const {
  buildUserPayload,
  signAccessToken,
} = require("../../helpers/auth-user");
const {
  getDirectUploadSignature,
  deleteMediaFromCloudinary,
} = require("../../helpers/cloudinary");

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

const registerUser = async (req, res) => {
  const { userName, userEmail, password } = req.body;
  const normalizedEmail = normalizeEmail(userEmail);

  const existingUser = await User.findOne({
    $or: [{ userEmail: normalizedEmail }, { userName }],
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User name or user email already exists",
    });
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const adminCount = await User.countDocuments({ role: "admin" });

  let role = "user";
  if (adminCount === 0 && adminEmail && normalizedEmail === adminEmail) {
    role = "admin";
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    userName,
    userEmail: normalizedEmail,
    role,
    password: hashPassword,
  });

  await newUser.save();

  return res.status(201).json({
    success: true,
    message: "User registered successfully!",
  });
};

const loginUser = async (req, res) => {
  const { userEmail, password } = req.body;
  const normalizedEmail = normalizeEmail(userEmail);

  const checkUser = await User.findOne({ userEmail: normalizedEmail });

  if (!checkUser || !(await bcrypt.compare(password, checkUser.password))) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  const accessToken = signAccessToken(checkUser);

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    data: {
      accessToken,
      user: buildUserPayload(checkUser),
    },
  });
};

const checkAuthUser = async (req, res) => {
  const currentUser = await User.findById(req.user._id);

  if (!currentUser) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Authenticated user!",
    data: {
      user: buildUserPayload(currentUser),
    },
  });
};

const getProfileUploadSignature = async (req, res) => {
  try {
    const folder =
      (req.body && req.body.folder) ||
      process.env.CLOUDINARY_PROFILE_FOLDER ||
      "vikash-profiles";
    const data = getDirectUploadSignature({ folder });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Could not create profile upload signature",
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const {
      userName,
      profileImage,
      profileImagePublicId,
      rollNumber,
      phoneNumber,
      address,
      about,
    } = req.body;

    const nextUserName = String(userName || currentUser.userName).trim();
    if (!nextUserName) {
      return res.status(400).json({
        success: false,
        message: "User name is required",
      });
    }

    if (nextUserName !== currentUser.userName) {
      const existingUser = await User.findOne({
        userName: nextUserName,
        _id: { $ne: currentUser._id },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User name already exists",
        });
      }
    }

    const nextProfileImage = String(profileImage || "").trim();
    const nextProfileImagePublicId = String(profileImagePublicId || "").trim();
    const previousProfileImagePublicId =
      currentUser.profileImagePublicId || "";

    currentUser.userName = nextUserName;
    currentUser.profileImage = nextProfileImage;
    currentUser.profileImagePublicId = nextProfileImagePublicId;
    currentUser.rollNumber = String(rollNumber || "").trim();
    currentUser.phoneNumber = String(phoneNumber || "").trim();
    currentUser.address = String(address || "").trim();
    currentUser.about = String(about || "").trim();

    await currentUser.save();

    if (
      previousProfileImagePublicId &&
      nextProfileImagePublicId &&
      previousProfileImagePublicId !== nextProfileImagePublicId
    ) {
      try {
        await deleteMediaFromCloudinary(previousProfileImagePublicId);
      } catch (error) {
        console.log("profile image cleanup failed:", error.message);
      }
    }

    const accessToken = signAccessToken(currentUser);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        accessToken,
        user: buildUserPayload(currentUser),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error updating profile",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  checkAuthUser,
  getProfileUploadSignature,
  updateUserProfile,
};
