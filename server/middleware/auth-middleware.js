const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../helpers/jwt-secret");
const { buildUserPayload } = require("../helpers/auth-user");
const User = require("../models/User");

const verifyToken = (token, secretKey) => {
  return jwt.verify(token, secretKey);
};

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "User is not authenticated",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token, getJwtSecret());
    const currentUser = await User.findById(payload._id);

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    req.user = buildUserPayload(currentUser);

    next();
  } catch (e) {
    return res.status(401).json({
      success: false,
      message: "invalid token",
    });
  }
};

module.exports = authenticate;
