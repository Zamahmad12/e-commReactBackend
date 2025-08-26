const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI; // set this on Vercel
if (!uri) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

mongoose
  .connect(uri, { dbName: process.env.MONGODB_DB || "ecommdash" })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
module.exports = mongoose;