const mongoose = require("mongoose");

const otpVerificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  otp: {
    type: String, // Hashed OTP
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  }
});

const OTPVerification = mongoose.model("OTPVerification", otpVerificationSchema);
module.exports = OTPVerification;