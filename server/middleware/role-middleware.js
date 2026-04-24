const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
};

const requireInstructorOrAdmin = (req, res, next) => {
  if (!req.user || !["admin", "instructor"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Instructor or admin access required",
    });
  }

  next();
};

const requireStudent = (req, res, next) => {
  if (!req.user || req.user.role !== "user") {
    return res.status(403).json({
      success: false,
      message: "Student access required",
    });
  }

  next();
};

module.exports = { requireAdmin, requireInstructorOrAdmin, requireStudent };
