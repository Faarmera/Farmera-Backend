const express = require("express")
const router = express.Router()
const { adminSignUp, buyerSignUp, farmerSignUp, signOut, signIn, verifyEmail, resendVerificationEmail, resetPassword, forgotPassword} = require("../controllers/authController.js")
const {protectRoute} = require("../middlewares/protectRoute.js")
const authorize = require('../middlewares/roleCheckMiddleware.js');

router.post("/signup/admin", authorize(['admin']), adminSignUp)
router.post("/signup/buyer", authorize([`buyer`, `farmer`]), buyerSignUp)
router.post("/signup/farmer", authorize([`buyer`, `farmer`]), farmerSignUp)
router.post("/signin", signIn);
router.post("/signout", protectRoute, signOut);
router.get("/verify/:userId/:uniqueString", verifyEmail)
router.post("/resendVerificationEmail", resendVerificationEmail)
router.post("/forgotPassword", authorize(['admin', `buyer`, `farmer`]), forgotPassword);
router.post("/resetPassword", authorize(['admin', `buyer`, `farmer`]), resetPassword);

module.exports = router