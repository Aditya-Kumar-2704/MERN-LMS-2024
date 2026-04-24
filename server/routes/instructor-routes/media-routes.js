const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const {
  uploadMediaToCloudinary,
  deleteMediaFromCloudinary,
  getDirectUploadSignature,
} = require("../../helpers/cloudinary");

const router = express.Router();

// Test endpoint to verify Cloudinary configuration
// Signed params for browser → Cloudinary direct upload (skips proxy through this server)
router.post("/sign-upload", (req, res) => {
  try {
    if (!cloudinary.config().cloud_name) {
      return res.status(503).json({
        success: false,
        message: "Cloudinary is not configured",
      });
    }
    const folder =
      (req.body && req.body.folder) ||
      process.env.CLOUDINARY_UPLOAD_FOLDER ||
      "vikash-courses";
    const data = getDirectUploadSignature({ folder });
    res.status(200).json({ success: true, data });
  } catch (e) {
    console.error("sign-upload error:", e);
    res.status(500).json({
      success: false,
      message: e.message || "Could not create upload signature",
    });
  }
});

router.get("/test-config", (req, res) => {
  const config = cloudinary.config();
  
  res.status(200).json({
    success: true,
    cloudinary_configured: !!config.cloud_name,
    details: {
      cloud_name: config.cloud_name ? "✓ Set" : "✗ Not set",
      api_key: config.api_key ? "✓ Set" : "✗ Not set",
      api_secret: config.api_secret ? "✓ Set" : "✗ Not set",
    }
  });
});

// Configure multer with size limit
const upload = multer({ 
  dest: "uploads/",
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB limit
  }
});

// Custom error handler for multer
const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "FILE_TOO_LARGE") {
      return res.status(413).json({
        success: false,
        message: "File size exceeds 500MB limit",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files uploaded at once",
      });
    }
  }
  next(err);
};

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file provided",
      });
    }

    console.log(`\n📤 UPLOAD START: ${req.file.originalname}`);
    console.log(`   Size: ${(req.file.size / (1024 * 1024)).toFixed(2)}MB`);
    console.log(`   Type: ${req.file.mimetype}`);
    
    const result = await uploadMediaToCloudinary(req.file.path);
    
    console.log(`✅ UPLOAD SUCCESS: ${req.file.originalname}`);
    console.log(`   URL: ${result.secure_url}\n`);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (e) {
    console.error(`❌ UPLOAD FAILED:\n`, e);

    res.status(500).json({ 
      success: false, 
      message: e.message || "Error uploading file" 
    });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assest Id is required",
      });
    }

    await deleteMediaFromCloudinary(id);

    res.status(200).json({
      success: true,
      message: "Assest deleted successfully from cloudinary",
    });
  } catch (e) {
    console.log(e);

    res.status(500).json({ 
      success: false, 
      message: "Error deleting file" 
    });
  }
});

router.post("/bulk-upload", upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files provided",
      });
    }

    console.log(`\n📦 BULK UPLOAD START: ${req.files.length} files`);
    
    // Sequential upload instead of parallel to prevent overwhelming the server
    const results = [];
    for (const fileItem of req.files) {
      try {
        console.log(`   📤 Uploading: ${fileItem.originalname} (${(fileItem.size / (1024 * 1024)).toFixed(2)}MB)`);
        const result = await uploadMediaToCloudinary(fileItem.path);
        results.push(result);
        console.log(`   ✅ Done: ${fileItem.originalname}`);
      } catch (err) {
        console.error(`   ❌ Failed: ${fileItem.originalname} - ${err.message}`);
      }
    }

    if (results.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload any files",
      });
    }

    console.log(`✅ BULK UPLOAD COMPLETE: ${results.length}/${req.files.length} files\n`);
    
    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (event) {
    console.error("❌ BULK UPLOAD ERROR:\n", event);

    res
      .status(500)
      .json({ success: false, message: "Error in bulk uploading files" });
  }
});

module.exports = router;
