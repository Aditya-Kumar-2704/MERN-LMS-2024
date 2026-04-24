const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// Configure Cloudinary at module load time with detailed logging
console.log("\n🔧 CLOUDINARY CONFIG:");
console.log("   CLOUD_NAME:", process.env.CLOUD_NAME ? "✓" : "❌ MISSING");
console.log("   API_KEY:", process.env.API_KEY ? "✓" : "❌ MISSING");
console.log("   API_SECRET:", process.env.API_SECRET ? "✓" : "❌ MISSING");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

console.log("   Status:", cloudinary.config().cloud_name ? "✓ Configured" : "❌ Not Configured\n");

/**
 * Params for browser direct upload (signed). Keep in sync with what the client sends.
 */
function getDirectUploadSignature(overrides = {}) {
  const folder =
    overrides.folder ||
    process.env.CLOUDINARY_UPLOAD_FOLDER ||
    "vikash-courses";
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { folder, timestamp };
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.API_SECRET
  );
  return {
    signature,
    timestamp,
    folder,
    cloudName: process.env.CLOUD_NAME,
    apiKey: process.env.API_KEY,
  };
}

const uploadMediaToCloudinary = async (filePath) => {
  try {
    if (!cloudinary.config().cloud_name) {
      throw new Error("Cloudinary not configured. Check CLOUD_NAME env variable.");
    }

    console.log("\n📤 Starting Cloudinary upload...");
    
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
      timeout: 600000,
      chunk_size: 12000000, // larger chunks = fewer round-trips for big videos (max ~20MB)
    });

    console.log("✅ Upload complete!");
    
    // Delete the local file after successful upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("🗑️  Temp file cleaned up\n");
    }

    return result;
  } catch (error) {
    console.error("\n❌ Cloudinary error:\n", {
      message: error.message,
      status: error.http_code,
      details: error
    });
    
    // Clean up the local file on error
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error("Failed to delete temp file:", e.message);
      }
    }
    
    throw new Error(error.message || "Error uploading to cloudinary");
  }
};

const deleteMediaFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`🗑️  Deleted from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error("Delete error:", error.message);
    throw new Error("failed to delete asset from cloudinary");
  }
};

module.exports = {
  uploadMediaToCloudinary,
  deleteMediaFromCloudinary,
  getDirectUploadSignature,
};
