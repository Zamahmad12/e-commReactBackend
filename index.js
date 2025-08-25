require("dotenv").config();
const express = require('express');
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require('jsonwebtoken');
const secretkey = 'fact'
require('./db/config');
const users = require('./db/users');
const products = require('./db/products');
app = express();

app.use(express.json());

const allowedOrigins = [
  "http://localhost:3000", // ✅ local React
  "https://e-comm-react-frontend.vercel.app" // ✅ deployed React
];

// ✅ Dynamic CORS handling
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Serve uploads folder correctly
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // absolute path
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + ".jpg"); // normalize everything to .jpg
  },
});

const upload = multer({ storage: storage });

app.post('/register',upload.single('profilePic'),async(req ,resp)=>{
     let user = new users({
      ...req.body,
      profilePic: req.file ? `/uploads/${req.file.filename}` : null, 
    });
    let result =await user.save();
    result= result.toObject();
    delete result.password;
    console.log(result);
       jwt.sign({result}, secretkey, {expiresIn: '2h'}, (err, token) => {
            if (err) {
                resp.send({result: "Error signing token"});
            } else {
                resp.send({result, token});
            }
        });
})
app.post('/login', async(req ,resp)=>{
    if(req.body.password && req.body.email){
    let user = await users.findOne(req.body).select("-password");
    if (user) {
        jwt.sign({user}, secretkey, {expiresIn: '4h'}, (err, token) => {
            if (err) {
                resp.send({result: "Error signing token"});
            } else {
                resp.send({user, token});
            }
        });
    } else {
        resp.send({result:"No user found"});
    }
}else {
        resp.send({result:"Invalid credentials"});
    }
});
app.post('/add-product',authenticateToken, async(req ,resp)=>{
    const product = new products(req.body);
    const result =await product.save();
    resp.send(result);
})
app.get('/products',authenticateToken, async(req ,resp)=>{
    const allProducts = await products.find();
    resp.send(allProducts);
});
app.delete('/product/:id',authenticateToken, async (req, resp) => {
    const result = await products.findByIdAndDelete(req.params.id);
    resp.send(result);
});
app.get('/product/:id',authenticateToken, async (req, resp) => {
    const result = await products.findById(req.params.id);
    resp.send(result);
});
app.put('/product/:id',authenticateToken, async (req, resp) => {
    const result = await products.findByIdAndUpdate(req.params.id, req.body);
    resp.send(result);
});
app.get('/search/:key',authenticateToken,  async (req, resp) => {
    const result = await products.find({
        $or: [
            { name: { $regex: req.params.key } },
            { company: { $regex: req.params.key } },
            { category: { $regex: req.params.key } }

        ]
    });
    resp.send(result);
});
function authenticateToken(req, res, next) {
    let token = req.headers['authorization'];
    if (token){
        token = token.split(' ')[1];
        
        jwt.verify(token, secretkey, (err, valid) => {
            if (err) {
                res.status(401).send({Error: "Please provide a valid token "});
            }else {
                next();
            }
        });
    }else {
        res.status(403).send({result: "Please provide token with header"});
    }
}
app.get("/", (req, res) => {
  res.send("Backend running!");
});
app.listen(5000)