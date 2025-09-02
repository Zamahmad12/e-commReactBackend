// routes/cloudinary.js
const express = require("express");
const cloudinary = require("../cloudinary");
const router = express.Router();
const cors = require("cors");

// ✅ Allow your frontend domains
const allowedOrigins = [
  "http://localhost:3000",
  "https://e-comm-react-frontend.vercel.app",
];

router.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// GET /api/cloudinary/get-signature
router.get("/cloudinary/get-signature", (req, res) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = req.query.folder || "users/profile_pics";

    // Create signature using Cloudinary SDK
    const signature = cloudinary.utils.api_sign_request(
      { folder, timestamp },
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      signature,
      timestamp,
      folder,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (err) {
    console.error("Signature error:", err);
    res.status(500).json({ error: "Signature generation failed" });
  }
});

module.exports = router;
