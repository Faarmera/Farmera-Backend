const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    require: true,
  },
  lastname: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
    unique: true
  },
  emailVerified: {
    type: Boolean, 
    default: false 
  },
  type: {
    type: String,
    enum: ["buyer", "farmer"],
    default: ""
  },
  phonenumber: {
    type: Number,
    require: true,
    unique: true,
    minLength: 11
  },
  farmAddress: {
    type: String,
  },
  state: {
    type:String,
  },
  password: {
    type: String,
    require: true,
    minLength: 8
  },
  role: { 
  type: mongoose.Schema.Types.ObjectId, 
  ref: 'Role' 
  },
  created_at: { 
    type: Date, 
    default: Date.now
  },
  updated_at: { 
    type: Date, 
    default:Date.now
  },
}, 
  { timestamps: true }
)

const User = mongoose.model("User", userSchema);

module.exports = User