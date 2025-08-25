// db/config.js
const mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config();
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/e-commDash";

mongoose.connect(mongoURI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

module.exports = mongoose;
