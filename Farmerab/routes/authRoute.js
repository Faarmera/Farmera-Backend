const express = require("express")
const router = express.Router()
const { adminSignUp, buyerSignUp, farmerSignUp, signOut, signIn, verifyEmail, resendVerificationEmail, resetPassword, forgotPassword, verifyOTP, resendOTP} = require("../controllers/authController.js")
const {protectRoute} = require("../middlewares/protectRoute.js")
// const authorize = require('../middlewares/roleCheckMiddleware.js');

router.post("/signup/admin", adminSignUp)
router.post("/signup/buyer", buyerSignUp)
router.post("/signup/farmer", farmerSignUp)
router.post("/signin",  signIn);
router.post("/signout", protectRoute, signOut);
router.get("/verify/:userId/:uniqueString", verifyEmail)
router.post("/resendVerificationEmail", resendVerificationEmail)
router.post("/forgotPassword",  forgotPassword);
router.post("/resetPassword",  resetPassword);
router.post("/verifyOTP",  verifyOTP)
router.post("/resendOTP", resendOTP)

// authorize(['admin, buyer, farmer']),
module.exports = router