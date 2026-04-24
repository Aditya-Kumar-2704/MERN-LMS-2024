const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("./jwt-secret");

function buildUserPayload(user) {
  return {
    _id: String(user._id),
    userName: user.userName,
    userEmail: user.userEmail,
    role: user.role,
    profileImage: user.profileImage || "",
    profileImagePublicId: user.profileImagePublicId || "",
    rollNumber: user.rollNumber || "",
    phoneNumber: user.phoneNumber || "",
    address: user.address || "",
    about: user.about || "",
  };
}

function buildTokenPayload(user) {
  const payload = buildUserPayload(user);

  return {
    _id: payload._id,
    userName: payload.userName,
    userEmail: payload.userEmail,
    role: payload.role,
  };
}

function signAccessToken(user) {
  return jwt.sign(buildTokenPayload(user), getJwtSecret(), {
    expiresIn: "120m",
  });
}

module.exports = {
  buildUserPayload,
  buildTokenPayload,
  signAccessToken,
};
