const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    userName: { type: String, trim: true },
    userEmail: { type: String, trim: true, lowercase: true },
    password: String,
    role: { type: String, default: "user" },
    profileImage: { type: String, default: "" },
    profileImagePublicId: { type: String, default: "" },
    rollNumber: { type: String, default: "", trim: true },
    phoneNumber: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    about: { type: String, default: "", trim: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", UserSchema);
