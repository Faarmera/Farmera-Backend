require("dotenv").config();
const express = require("express");
const connectDB = require("../config/index.js");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const cloudinary = require("cloudinary").v2
const path = require("path");
const app = express();
const bodyParser = require("body-parser")
const seedRoles = require('../controllers/roleController.js');

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "views")));
app.use(cookieParser());

app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:5175', 'http://localhost:5174', `https://farm-olive.vercel.app`, 'https://faarmeeraa.netlify.app' , 'https://farmera-1.vercel.app' ,  'https://farmera-eyu3.onrender.com'];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(bodyParser.json({ limit: "20mb" }));
app.use(bodyParser.urlencoded({ limit: "20mb", extended: true }));


app.get('/', (req, res) => {
  res.send('Welcome to Farmera API! the portal to a new world');
});


// Routes
const authRoutes = require("../routes/authRoute.js");
const userRoutes = require("../routes/userRoute.js");
const productRoutes = require("../routes/productRoute.js");
const cartRoutes = require("../routes/cartRoute.js");
const categoryRoutes = require("../routes/categoryRoute.js");
const orderRoutes = require("../routes/orderRoute.js");
const roleRoutes = require("../routes/roleRoute.js")
// const paymentRoutes = require("../routes/paymentRoute.js");




app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/role", roleRoutes);
// app.use("/api/v1/payment", paymentRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost: ${PORT}`);
  connectDB();
});
