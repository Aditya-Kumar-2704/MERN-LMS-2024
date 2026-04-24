require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth-routes/index");
const mediaRoutes = require("./routes/instructor-routes/media-routes");
const instructorCourseRoutes = require("./routes/instructor-routes/course-routes");
const instructorLiveClassRoutes = require("./routes/instructor-routes/live-class-routes");
const studentViewCourseRoutes = require("./routes/student-routes/course-routes");
const studentViewOrderRoutes = require("./routes/student-routes/order-routes");
const studentCoursesRoutes = require("./routes/student-routes/student-courses-routes");
const studentCourseProgressRoutes = require("./routes/student-routes/course-progress-routes");
const studentExamRoutes = require("./routes/student-routes/exam-routes");
const studentResultRoutes = require("./routes/student-routes/result-routes");
const studentLiveClassRoutes = require("./routes/student-routes/live-class-routes");
const studentAssessmentRoutes = require("./routes/student-routes/assessment-routes");
const adminRoutes = require("./routes/admin-routes/index");
const authenticate = require("./middleware/auth-middleware");
const {
  requireAdmin,
  requireInstructorOrAdmin,
} = require("./middleware/role-middleware");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const configuredClientOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const developmentClientOrigins =
  process.env.NODE_ENV === "production"
    ? []
    : [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
      ];
const allowedOrigins = [
  ...new Set([...configuredClientOrigins, ...developmentClientOrigins]),
];

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json({ limit: "10mb" }));

//database connection
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("mongodb is connected"))
  .catch((e) => console.log(e));

//routes configuration
app.use("/auth", authLimiter, authRoutes);
app.use("/media", authenticate, requireInstructorOrAdmin, mediaRoutes);
app.use(
  "/instructor/course",
  authenticate,
  requireInstructorOrAdmin,
  instructorCourseRoutes
);
app.use(
  "/instructor/live-class",
  authenticate,
  requireInstructorOrAdmin,
  instructorLiveClassRoutes
);
app.use("/student/course", studentViewCourseRoutes);
app.use("/student/order", studentViewOrderRoutes);
app.use("/student/courses-bought", studentCoursesRoutes);
app.use("/student/course-progress", studentCourseProgressRoutes);
app.use("/student/exam", studentExamRoutes);
app.use("/student/result", authenticate, studentResultRoutes);
app.use("/student/live-class", authenticate, studentLiveClassRoutes);
app.use("/student/assessment", studentAssessmentRoutes);
app.use("/admin", authenticate, requireAdmin, adminRoutes);

app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
});

app.listen(PORT, () => {
  console.log(`Server is now running on port ${PORT}`);
});
