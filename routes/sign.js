const express = require("express");
const cloudinary = require("../cloudinary");
const router = express.Router();
const cors = require("cors");

// Allow only your frontend
router.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://e-comm-react-frontend.vercel.app",
    ],
    credentials: true,
  })
);

router.get("/cloudinary/get-signature", (req, res) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = req.query.folder || "users/profile_pics";

<<<<<<< HEAD
    const paramsToSign = { folder, timestamp };
=======
    const paramsToSign = {
      folder,
      timestamp,
    };
>>>>>>> aa4d25ff5a93fb7a6347113faf38d64056038732

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
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
