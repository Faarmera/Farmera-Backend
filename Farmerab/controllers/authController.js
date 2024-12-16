const User = require("../models/User.js");
const jwt = require("jsonwebtoken")
const UserVerification = require("../models/UserVerification.js")
const { sendEmail } = require('../controllers/emailController.js');
const { v4: uuidv4 } = require('uuid');
const generateTokenAndSetCookie = require("../utils/generateTokenAndSetCookie.js");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer')
const OTP = require("../models/OTP.js")
const crypto = require("crypto")
require("dotenv").config();
const path = require('path');
const Role = require("../models/Role.js")
const authorize = require('../middlewares/roleCheckMiddleware.js');


const verifyEmail = async (req, res) => {
  const { userId, uniqueString } = req.params;

    try {
        const verificationRecord = await UserVerification.findOne({ userId });
        if (!verificationRecord) {
            return res.status(404).sendFile(path.join(__dirname, './'));
        }

        const { uniqueString: hashedString, expiresAt } = verificationRecord;

        if (expiresAt < Date.now()) {
            await UserVerification.deleteOne({ userId });
            return res.status(400).sendFile(path.join(__dirname, '../views/verificationFailed.html'));
        }

        const isMatch = await bcrypt.compare(uniqueString, hashedString);
        if (!isMatch) {
            return res.status(400).sendFile(path.join(__dirname, '../views/verificationFailed.html'));
        }

        await User.updateOne({ _id: userId }, { emailVerified: true });

        await UserVerification.deleteOne({ userId });

        return res.status(200).sendFile(path.join(__dirname, '../views/verificationSuccessful.html'));
    } catch (error) {
        console.error('Error during email verification:', error.message);
        return res.status(500).sendFile(path.join(__dirname, '../views/verificationFailed.html'));
    }
};

const resendVerificationEmail = async (req, res) => {
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

    const uniqueString = uuidv4() + user._id;
    const hashedString = await bcrypt.hash(uniqueString, 10);

    const verificationRecord = await UserVerification.findOneAndUpdate(
      { userId: user._id },
      {
        uniqueString: hashedString,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
      },
      { upsert: true, new: true }
    );

    const verificationUrl = `${process.env.BASE_URL}/auth/verify/${user._id}/${uniqueString}`;
    const emailHtml = `
      <p> <strong> Hi there</strong>, <br>  <br> Thank you for signing up on Farmera. <br>  <br> Click on the link below to verify your email: <br>
        <a href="${verificationUrl}">Verify Email</a> <br>
        This link will expire in 30 minutes. <br>
        If you did not sign up for a Farmera account, you can safely ignore this email. <br> <br><br>
        Best, <br>  <br>
        The Farmera Team</p>
    `;

    await sendEmail(email, "Farmera Resend Verification Email", emailHtml);

    res.status(200).json({ message: "Verification email has been resent" });
  } catch (error) {
    console.error("Error in resendVerification endpoint:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const forgotPassword = async (req, res) => {
    try{
    
    const user = await User.findOne({ email: req.body.email})
   
    if(!user){
      return res.status(404).json({error: "user not found"})
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const type = "forgotPassword"

    await OTP.create({
      user:user._id, 
      otp,
      type,
      expiresAt: expiresAt
    })

    return res.status(200).json({ message: "OTP sent successfully"})
   
    } catch (error){
      console.log("error in forgot password controller", error)
      res.status(500).json({ error: error.message})
    }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, comfirmNewPassword } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!newPassword || !comfirmNewPassword) {
      return res.status(400).json({ message: "New password and confirm new password are required" });
    }

    if (newPassword !== comfirmNewPassword) {
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

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error in reset password controller: ", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
    
};

const verifyOTP = async (req, res) => {
  try{

    const { otp, email } = req.body;

    const existingUser = await User.findOne({email});
    if(!existingUser){
      return res.status(400).json({ message: "Invalid email"})
    }

    const OTPExists = await OTP.findOne({ user:existingUser._id, otp:otp})
    if(!OTPExists){
      return res.status(400).json({ message: "invalid OTP"})
    }

    if(OTPExists.expiresAt < new Date()){
      return res.status(400).json({ message: "OTP has expired"})
    }

    await await OTP.deleteOne({ 
      user: existingUser._id, 
    });  
    return res.status(200).json({message: "OTP verified successfully"});

  } catch (error) {
      console.log("error in verify otp controller: ", error.message)
      return res.status(500).json({ error: "Internal server error"})
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Missing required parameters.' });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(400).json({ message: 'Invalid Email.' });
    }

    const currentTime = new Date();
    const existingOtp = await OTP.findOne({ 
      user: existingUser._id,
      expiresAt: { $gt: currentTime } 
    });

    if (existingOtp) {
      const remainingTime = Math.ceil((existingOtp.expiresAt - currentTime) / 60000);
      return res.status(400).json({ 
        message: `An OTP is still valid. Please wait ${remainingTime} minute(s) before requesting a new one.`,
        remainingTime: `${remainingTime} minutes`
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    await OTP.deleteMany({ 
      user: existingUser._id, 
      expiresAt: { $lte: currentTime } 
    });

    await OTP.create({ 
      user: existingUser._id, 
      otp, 
      expiresAt: expiresAt 
    });

    console.log(`OTP for ${email}: ${otp}`);

    return res.status(200).json({ 
      message: `OTP for ${email} has been sent out successfully.` 
    });
  } catch (error) {
    console.log("Error in resend Otp controller", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const adminSignUp = async (req, res) => {
  try {
    const { firstname, lastname, email, phonenumber, password} = req.body;

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

    const uniqueString = uuidv4() + newUser._id;

    await UserVerification.create({
        userId: newUser._id,
        uniqueString: await bcrypt.hash(uniqueString, 10),
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
    });

    const verificationUrl = `${process.env.BASE_URL}/auth/verify/${newUser._id}/${uniqueString}`;
    const emailHtml = `
        <p> <strong> Hi there</strong>, <br>  <br> Thank you for signing up on Farmera. <br>  <br> Click on the link below to verify your email: <br>
        <a href="${verificationUrl}">Verify Email</a> <br>
        This link will expire in 30 minutes. <br>
        If you did not sign up for a Farmera account, you can safely ignore this email. <br> <br><br>
        Best, <br>  <br>
        The Farmera Team</p>
    `;

    await sendEmail(email, 'Farmera Verification Mail', emailHtml);

    res.status(201).json({
        message: 'User created. Verification email sent.',
        user: {
            _id: newUser._id,
            firstname: newUser.firstname,
            lastname: newUser.lastname,
            email: newUser.email,
            type: newUser.type ,
            phonenumber: newUser.phonenumber,
            role: userRole._id
        },
    });
} catch (error) {
    console.error("Error in signFarmerUp controller:", error.message);
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

    const uniqueString = uuidv4() + newUser._id;

    await UserVerification.create({
        userId: newUser._id,
        uniqueString: await bcrypt.hash(uniqueString, 10),
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
    });

    const verificationUrl = `${process.env.BASE_URL}/auth/verify/${newUser._id}/${uniqueString}`;
    const emailHtml = `
        <p> <strong> Hi there</strong>, <br>  <br> Thank you for signing up on Farmera. <br>  <br> Click on the link below to verify your email: <br>
        <a href="${verificationUrl}">Verify Email</a> <br>
        This link will expire in 30 minutes. <br>
        If you did not sign up for a Farmera account, you can safely ignore this email. <br> <br><br>
        Best, <br>  <br>
        The Farmera Team</p>
    `;

    await sendEmail(email, 'Farmera Verification Mail', emailHtml);

    res.status(201).json({
        message: 'User created. Verification email sent.',
        user: {
            _id: newUser._id,
            firstname: newUser.firstname,
            lastname: newUser.lastname,
            email: newUser.email,
            type: newUser.type ,
            phonenumber: newUser.phonenumber,
            farmAddress: newUser. farmAddress,
            state: newUser.state,
            role: userRole._id
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

    const uniqueString = uuidv4() + newUser._id;

    await UserVerification.create({
        userId: newUser._id,
        uniqueString: await bcrypt.hash(uniqueString, 10),
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
    });

    if (!process.env.BASE_URL) {
      console.error('BASE_URL is not defined in your environment variables.');
    }

    const verificationUrl = `${process.env.BASE_URL}/auth/verify/${newUser._id}/${uniqueString}`;
    const emailHtml = `
        <p> <strong> Hi there</strong>, <br>  <br> Thank you for signing up on Farmera. <br>  <br> Click on the link below to verify your email: <br>
        <a href="${verificationUrl}">Verify Email</a> <br>
        This link will expire in 30 minutes. <br>
        If you did not sign up for a Farmera account, you can safely ignore this email. <br> <br><br>
        Best, <br>  <br>
        The Farmera Team</p>
    `;

    await sendEmail(email, 'FARMERA Verification Mail', emailHtml);

    res.status(201).json({
        message: 'User created. Verification email sent.',
        user: {
          _id: newUser._id,
          firstname: newUser.firstname,
          lastname: newUser.lastname,
          email: newUser.email,
          type: newUser.type,
          phonenumber: newUser.phonenumber,
          role: userRole._id
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
    const user = await User.findOne({email})
    const isPasswordCorrect = await bcrypt.compare(password, user?.password || "")
  
    if(!user || !isPasswordCorrect){
      return res.status(400).json({error: "Invalid username or password"})
    }

    generateTokenAndSetCookie (user._id, res);
    
    res.status(200).json({
    _id: user._id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    phonenumber: user.phonenumber,
    });

  } catch(error) {
    console.log("error in login controller", error.message);
    res.status(500).json({ error: "internal Server Error" });
  }
};
  
const signOut = async (req, res) => {
  try{
    res.cookie("jwt","", {maxAge:0} )
    res.status(200).json({message: "logged out successfully"})
  }catch(error){
    console.log("error in logout controller", error.message);
    res.status(500).json({ error: "internal Server Error" });
  }
};

module.exports = {
  adminSignUp, buyerSignUp, farmerSignUp, signOut, signIn, resetPassword, forgotPassword, verifyOTP, resendOTP, verifyEmail, resendVerificationEmail
}