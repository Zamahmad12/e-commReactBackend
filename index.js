require("dotenv").config();
const cloudinary = require("./cloudinary");

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

require("./db/config");
const users = require("./db/users");
const products = require("./db/products");

const secretkey = process.env.JWT_SECRET || "fallbackSecret";

const app = express();
app.use(express.json());

// CORS: include localhost + production + preview
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://e-comm-react-frontend.vercel.app"
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 200, // 👈 important for some browsers
  })
);

// Explicitly handle OPTIONS for all routes
app.options("*", cors());

// Multer memory storage (no disk)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// helper: upload buffer to cloudinary
function uploadBufferToCloudinary(buffer, folder = "profiles") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}


// -------- ROUTES --------
app.post("/register", upload.single("profilePic"), async (req, resp) => {
  try {
    let profilePicUrl = null;
    if (req.file && req.file.buffer) {
      const uploadRes = await uploadBufferToCloudinary(req.file.buffer, "users/profile_pics");
      profilePicUrl = uploadRes.secure_url;
    }

    let user = new users({
      ...req.body,
      profilePic: profilePicUrl
    });

    let result = await user.save();
    result = result.toObject();
    delete result.password;

    jwt.sign({ user: result }, secretkey, { expiresIn: "2h" }, (err, token) => {
      if (err) return resp.status(500).send({ result: "Error signing token" });
      resp.send({ user: result, token });
    });
  } catch (err) {
    console.error("Register error:", err);
    resp.status(500).send({ error: "Registration failed" });
  }
});
app.post("/login", async (req, resp) => {
  if (req.body.password && req.body.email) {
    let user = await users.findOne(req.body).select("-password");
    if (!user) return resp.send({ result: "No user found" });

    jwt.sign({ user }, secretkey, { expiresIn: "4h" }, (err, token) => {
      if (err) return resp.send({ result: "Error signing token" });
      resp.send({ user, token });
    });
  } else {
    resp.send({ result: "Invalid credentials" });
  }
});

app.post("/add-product", authenticateToken, async (req, resp) => {
  const product = new products(req.body);
  const result = await product.save();
  resp.send(result);
});

app.get("/products", authenticateToken, async (req, resp) => {
  const allProducts = await products.find();
  resp.send(allProducts);
});

app.delete("/product/:id", authenticateToken, async (req, resp) => {
  const result = await products.findByIdAndDelete(req.params.id);
  resp.send(result);
});

app.get("/product/:id", authenticateToken, async (req, resp) => {
  const result = await products.findById(req.params.id);
  resp.send(result);
});

app.put("/product/:id", authenticateToken, async (req, resp) => {
  const result = await products.findByIdAndUpdate(req.params.id, req.body);
  resp.send(result);
});

app.get("/search/:key", authenticateToken, async (req, resp) => {
  const result = await products.find({
    $or: [
      { name: { $regex: req.params.key, $options: "i" } },
      { company: { $regex: req.params.key, $options: "i" } },
      { category: { $regex: req.params.key, $options: "i" } }
    ]
  });
  resp.send(result);
});

function authenticateToken(req, res, next) {
  let token = req.headers["authorization"];
  if (!token) return res.status(403).send({ result: "Please provide token with header" });
  token = token.split(" ")[1];
  jwt.verify(token, secretkey, (err) => {
    if (err) return res.status(401).send({ Error: "Please provide a valid token " });
    next();
  });
}

app.get("/", (req, res) => res.send("Backend running!"));

module.exports = app; // <-- Do NOT app.listen() on Vercel
