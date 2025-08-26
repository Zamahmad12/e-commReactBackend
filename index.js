require("dotenv").config();
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

// ✅ CORS fix: allow only your frontend
app.use(cors({
  origin: "https://e-comm-react-frontend.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


// Serve uploads folder correctly
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + ".jpg"); // save as timestamp.jpg
  },
});
const upload = multer({ storage: storage });

// ================= Routes =================

// Register
app.post("/register", upload.single("profilePic"), async (req, resp) => {
  let user = new users({
    ...req.body,
    profilePic: req.file ? `/uploads/${req.file.filename}` : null,
  });

  let result = await user.save();
  result = result.toObject();
  delete result.password;

  jwt.sign({ result }, secretkey, { expiresIn: "2h" }, (err, token) => {
    if (err) {
      resp.send({ result: "Error signing token" });
    } else {
      resp.send({ result, token });
    }
  });
});

// Login
app.post("/login", async (req, resp) => {
  if (req.body.password && req.body.email) {
    let user = await users.findOne(req.body).select("-password");
    if (user) {
      jwt.sign({ user }, secretkey, { expiresIn: "4h" }, (err, token) => {
        if (err) {
          resp.send({ result: "Error signing token" });
        } else {
          resp.send({ user, token });
        }
      });
    } else {
      resp.send({ result: "No user found" });
    }
  } else {
    resp.send({ result: "Invalid credentials" });
  }
});

// Add product
app.post("/add-product", authenticateToken, async (req, resp) => {
  const product = new products(req.body);
  const result = await product.save();
  resp.send(result);
});

// Get all products
app.get("/products", authenticateToken, async (req, resp) => {
  const allProducts = await products.find();
  resp.send(allProducts);
});

// Delete product
app.delete("/product/:id", authenticateToken, async (req, resp) => {
  const result = await products.findByIdAndDelete(req.params.id);
  resp.send(result);
});

// Get single product
app.get("/product/:id", authenticateToken, async (req, resp) => {
  const result = await products.findById(req.params.id);
  resp.send(result);
});

// Update product
app.put("/product/:id", authenticateToken, async (req, resp) => {
  const result = await products.findByIdAndUpdate(req.params.id, req.body);
  resp.send(result);
});

// Search product
app.get("/search/:key", authenticateToken, async (req, resp) => {
  const result = await products.find({
    $or: [
      { name: { $regex: req.params.key, $options: "i" } },
      { company: { $regex: req.params.key, $options: "i" } },
      { category: { $regex: req.params.key, $options: "i" } },
    ],
  });
  resp.send(result);
});

// Middleware for token auth
function authenticateToken(req, res, next) {
  let token = req.headers["authorization"];
  if (token) {
    token = token.split(" ")[1];
    jwt.verify(token, secretkey, (err, valid) => {
      if (err) {
        res.status(401).send({ Error: "Please provide a valid token " });
      } else {
        next();
      }
    });
  } else {
    res.status(403).send({ result: "Please provide token with header" });
  }
}

app.get("/", (req, res) => {
  res.send("Backend running!");
});

// ✅ Export for Vercel
module.exports = app;

// ✅ Run locally only
if (require.main === module) {
  app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
  });
}

