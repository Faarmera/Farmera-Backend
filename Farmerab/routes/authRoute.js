const express = require("express")
const router = express.Router()
const { signBuyerUp, signFarmerUp, signOut, signIn, verifyEmail, resendVerificationEmail, resetPassword, forgotPassword, verifyOTP, resendOTP } = require("../controllers/authController.js")
const {protectRoute} = require("../middlewares/protectRoute.js")
// const authorize = require('../middlewares/roleCheckMiddleware.js');


router.post("/signbuyerup", signBuyerUp)
router.post("/signfarmerup", signFarmerUp)
router.post("/signin",  signIn);
router.post("/signout", protectRoute, signOut);
router.get("/verify/:userId/:uniqueString", verifyEmail)
router.post("/resendVerificationEmail", resendVerificationEmail)
// router.post("/passwordRecoveryMail", protectRoute, passwordRecoveryMail)
router.post("/forgotPassword",  forgotPassword);
router.post("/resetPassword",  resetPassword);
router.post("/verifyOTP",  verifyOTP)
router.post("/resendOTP", resendOTP)

// authorize(['admin, user']),
module.exports = router