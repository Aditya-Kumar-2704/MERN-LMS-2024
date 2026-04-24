const User = require("../../models/User");

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
    });
  }
};

// Update user role (admin cannot be assigned via API — single admin via ADMIN_EMAIL bootstrap only)
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "instructor"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Admin role cannot be assigned from the panel.",
      });
    }

    const target = await User.findById(userId);
    if (!target) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (target.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot change the administrator role from the panel.",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error updating user role",
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const target = await User.findById(userId);
    if (!target) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (target.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete the administrator account.",
      });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
    });
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  deleteUser,
};
