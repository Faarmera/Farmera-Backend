const express = require("express")
const router = express.Router()
const { adminSignUp, buyerSignUp, farmerSignUp, signOut, signIn, verifyOTP, resendVerificationOTP, resetPassword, forgotPassword} = require("../controllers/authController.js")
const {protectRoute} = require("../middlewares/protectRoute.js")
// const authorize = require('../middlewares/roleCheckMiddleware.js');

router.post("/signup/admin", adminSignUp)
router.post("/signup/buyer", buyerSignUp)
router.post("/signup/farmer", farmerSignUp)
router.post("/signin", signIn);
router.post("/signout", protectRoute, signOut);
router.post("/verify-otp", verifyOTP)
router.post("/resend-otp", resendVerificationOTP)
router.post("/forgotPassword", forgotPassword);
router.post("/resetPassword", resetPassword);

module.exports = router