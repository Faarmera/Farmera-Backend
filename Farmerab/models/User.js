const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  emailVerified: {
    type: Boolean, 
    default: false 
  },
  type: {
    type: String,
    enum: ["buyer", "farmer", "admin"],
    default: ""
  },
  phonenumber: {
    type: Number,
    required: true,
    unique: true,
    minLength: 11
  },
  farmAddress: {
    type: String,
  },
  state: {
    type: String,
  },
  password: {
    type: String,
    required: true,
    minLength: 8
  },
  role: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Role' 
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpiry: {
    type: Date,
    default: null
  },
  created_at: { 
    type: Date, 
    default: Date.now
  },
  updated_at: { 
    type: Date, 
    default: Date.now
  },
}, 
  { timestamps: true }
)

const User = mongoose.model("User", userSchema);

module.exports = User