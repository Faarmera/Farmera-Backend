const User = require("../models/User.js");
const jwt = require("jsonwebtoken")
const OTPVerification = require("../models/OTPVerification.js")
const { sendEmail } = require('../controllers/emailController.js');
// const { v4: uuidv4 } = require('uuid');
const generateTokenAndSetCookie = require("../utils/generateTokenAndSetCookie.js");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer')
const crypto = require("crypto")
require("dotenv").config();
const path = require('path');
const Role = require("../models/Role.js")


const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const verificationRecord = await OTPVerification.findOne({ userId: user._id });
    if (!verificationRecord) {
      return res.status(404).json({ 
        success: false, 
        message: 'Verification record not found' 
      });
    }

    const { otp: hashedOTP, expiresAt } = verificationRecord;

    if (expiresAt < Date.now()) {
      await OTPVerification.deleteOne({ userId: user._id });
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired' 
      });
    }

    const isMatch = await bcrypt.compare(otp, hashedOTP);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP' 
      });
    }

    await User.updateOne({ _id: user._id }, { emailVerified: true });
    await OTPVerification.deleteOne({ userId: user._id });

    return res.status(200).json({ 
      success: true, 
      message: 'Email verified successfully' 
    });
  } catch (error) {
    console.error('Error during OTP verification:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during verification' 
    });
  }
};

const generateOTP = (length = 6) => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

const resendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: "Email is already verified" });
    }

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    await OTPVerification.deleteMany({ userId: user._id });

    await OTPVerification.create({
      userId: user._id,
      otp: hashedOTP,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
    });

    const emailHtml = `
      <p><strong>Hi there</strong>,<br>
      Thank you for signing up on Farmera.<br>
      Your verification OTP is: <strong>${otp}</strong><br>
      This OTP will expire in 30 minutes.<br>
      If you did not sign up for a Farmera account, you can safely ignore this email.<br><br><br>
      Best,<br>
      The Farmera Team</p>
    `;

    await sendEmail(email, "Farmera Email Verification OTP", emailHtml);

    res.status(200).json({ message: "Verification OTP has been sent to your email" });
  } catch (error) {
    console.error("Error in resendVerificationOTP endpoint:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    
    user.resetPasswordToken = hashedOTP;
    user.resetPasswordExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const emailHtml = `
      <p><strong>Hello ${user.firstname},</strong></p><br>
      <p>You have requested a password reset for your Farmera account.</p><br>
      <p>Your password reset OTP is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email.</p><br>
      <p>Best regards,<br>The Farmera Team</p>
    `;

    await sendEmail(email, 'FARMERA Password Reset OTP', emailHtml);

    res.status(200).json({
      message: "Password reset OTP has been sent to your email"
    });
  } catch (error) {
    console.error("Error in forgot password controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmNewPassword } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    if (!newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: "New password and confirm new password are required" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "New password and confirm new password do not match" });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: "Password must contain at least one uppercase letter and one special character."
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User with this email does not exist" });
    }

    if (!user.resetPasswordToken || !user.resetPasswordExpiry) {
      return res.status(400).json({ message: "No password reset request was initiated" });
    }

    if (user.resetPasswordExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    const isMatch = await bcrypt.compare(otp, user.resetPasswordToken);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error in reset password controller: ", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.resetPasswordToken || !user.resetPasswordExpiry) {
      return res.status(400).json({ message: "No password reset request was initiated" });
    }

    if (user.resetPasswordExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    const isMatch = await bcrypt.compare(otp, user.resetPasswordToken);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error in verify reset OTP controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const adminSignUp = async (req, res) => {
  try {
    const { firstname, lastname, email, phonenumber, password } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must contain at least one uppercase letter and one special character.',
      });
    }

    if (phonenumber.length !== 11) {
      return res.status(400).json({ error: "Phone Number must be 11 digits long" });
    }

    const existingPhoneNumber = await User.findOne({ phonenumber });
    if (existingPhoneNumber) {
      return res.status(400).json({ error: "A user already has this phone number. Kindly use another" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email is already taken" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRole = await Role.findOne({ name: 'admin' });

    const newUser = new User({
      firstname,
      lastname,
      email,
      type: "admin",
      phonenumber,
      password: hashedPassword,
      emailVerified: false,
      role: userRole._id
    });

    await newUser.save();

    const populatedUser = await User.findById(newUser._id).populate('role');

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    await OTPVerification.create({
      userId: newUser._id,
      otp: hashedOTP,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
    });

    const emailHtml = `
      <p><strong>Hi there</strong>,<br>
      Thank you for signing up on Farmera.<br>
      Your verification OTP is: <strong>${otp}</strong><br>
      This OTP will expire in 30 minutes.<br>
      If you did not sign up for a Farmera account, you can safely ignore this email.<br><br><br>
      Best,<br>
      The Farmera Team</p>
    `;

    await sendEmail(email, 'FARMERA Verification OTP', emailHtml);

    res.status(201).json({
      message: 'User created. Verification OTP sent to your email.',
      token: jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '15d' }),
      user: {
        _id: populatedUser._id,
        firstname: populatedUser.firstname,
        lastname: populatedUser.lastname,
        email: populatedUser.email,
        type: populatedUser.type,
        phonenumber: populatedUser.phonenumber,
        role: {
          _id: populatedUser.role._id,
          name: populatedUser.role.name
        }
      },
    });
  } catch (error) {
    console.error("Error in adminSignUp controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const farmerSignUp = async (req, res) => {
  try {
    const { firstname, lastname, email, phonenumber, state, password, farmAddress } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message: 'Password must contain at least one uppercase letter and one special character.',
        });
    }

    if (phonenumber.length !== 11) {
        return res.status(400).json({ error: "Phone Number must be 11 digits long" });
    }

    const existingPhoneNumber = await User.findOne( {phonenumber });
    if (existingPhoneNumber) {
      return res.status(400).json({ error: "A user already has this phone number. Kindly use another"})
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
        return res.status(400).json({ error: "Email is already taken" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRole = await Role.findOne({ name: 'farmer' });

    const newUser = new User({
        firstname,
        lastname,
        email,
        type: "farmer",
        phonenumber,
        farmAddress,
        state,
        password: hashedPassword,
        emailVerified: false,
        role: userRole._id
    });

    await newUser.save();

    const populatedUser = await User.findById(newUser._id).populate('role');

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    await OTPVerification.create({
      userId: newUser._id,
      otp: hashedOTP,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
    });

    const emailHtml = `
      <p><strong>Hi there</strong>,<br>
      Thank you for signing up on Farmera.<br>
      Your verification OTP is: <strong>${otp}</strong><br>
      This OTP will expire in 30 minutes.<br>
      If you did not sign up for a Farmera account, you can safely ignore this email.<br><br><br>
      Best,<br>
      The Farmera Team</p>
    `;

    await sendEmail(email, 'FARMERA Verification OTP', emailHtml);

    res.status(201).json({
        message: 'User created. Verification email sent.',
        token: jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '15d' }),
        user: {
            _id: populatedUser._id,
            firstname: populatedUser.firstname,
            lastname: populatedUser.lastname,
            email: populatedUser.email,
            type: populatedUser.type ,
            phonenumber: populatedUser.phonenumber,
            farmAddress: populatedUser. farmAddress,
            state: populatedUser.state,
            role: {
              _id: populatedUser.role._id,
              name: populatedUser.role.name
          }
        },
    });
} catch (error) {
    console.error("Error in signFarmerUp controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
}
};
  
const buyerSignUp = async (req, res) => {
  try{
    const { firstname, lastname, email, phonenumber, password } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            message: 'Password must contain at least one uppercase letter and one special character.',
        });
    }

    if (phonenumber.length !== 11) {
        return res.status(400).json({ error: "Phone Number must be 11 digits long" });
    }

    const existingPhoneNumber = await User.findOne( {phonenumber });
    if (existingPhoneNumber) {
      return res.status(400).json({ error: "A user already has this phone number. Kindly use another"})
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
        return res.status(400).json({ error: "Email is already taken" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRole = await Role.findOne({ name: 'buyer' });

    const newUser = new User({
        firstname,
        lastname,
        email,
        type: "buyer",
        phonenumber,
        password: hashedPassword,
        emailVerified: false,
        role: userRole._id
    });

    await newUser.save();

    const populatedUser = await User.findById(newUser._id).populate('role');

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    await OTPVerification.create({
      userId: newUser._id,
      otp: hashedOTP,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
    });

    const emailHtml = `
      <p><strong>Hi there</strong>,<br>
      Thank you for signing up on Farmera.<br>
      Your verification OTP is: <strong>${otp}</strong><br>
      This OTP will expire in 30 minutes.<br>
      If you did not sign up for a Farmera account, you can safely ignore this email.<br><br><br>
      Best,<br>
      The Farmera Team</p>
    `;

    await sendEmail(email, 'FARMERA Verification OTP', emailHtml);

    res.status(201).json({
        message: 'User created. Verification email sent.',
        token: jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '15d' }),
        user: {
          _id: populatedUser._id,
          firstname: populatedUser.firstname,
          lastname: populatedUser.lastname,
          email: populatedUser.email,
          type: populatedUser.type,
          phonenumber: populatedUser.phonenumber,
          role: {
            _id: populatedUser.role._id,
            name: populatedUser.role.name
        }
        },
    });
  } catch (error) {
    console.error("Error in signBuyerUp controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
  
const signIn = async (req, res) => {
  try{
    const {email, password} = req.body;
    const user = await User.findOne({email}).populate('role');
    const isPasswordCorrect = await bcrypt.compare(password, user?.password || "")
  
    if(!user || !isPasswordCorrect){
      return res.status(400).json({error: "Invalid username or password"})
    }

    generateTokenAndSetCookie (user._id, res);

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { 
      expiresIn: '15d' 
    });
    
    res.status(200).json({
      token,
      user: {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phonenumber: user.phonenumber,
        type: user.type,
        role: {
          _id: user.role._id,
          name: user.role.name
        }
      }
    });

  } catch(error) {
    console.log("error in login controller", error.message);
    res.status(500).json({ error: "internal Server Error" });
  }
};
  
const signOut = async (req, res) => {
  try{
    res.cookie("jwt","", {maxAge:0} )
    res.status(200).json({message: "signed out successfully"})
  }catch(error){
    console.log("error in logout controller", error.message);
    res.status(500).json({ error: "internal Server Error" });
  }
};

module.exports = {
  adminSignUp, buyerSignUp, farmerSignUp, signOut, signIn, resetPassword, forgotPassword, verifyOTP, resendVerificationOTP, verifyResetOTP
}