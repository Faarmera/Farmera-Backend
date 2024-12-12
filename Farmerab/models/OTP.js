const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
    },
    otp: { 
    type: String, 
    required: true 
    },
    type: { 
    type: String,  
    enum: ["forgotPassword"]
    },
    createdAt: { 
    type: Date, 
    default: Date.now 
    },
    expiresAt: {    
    type: Date, 
    required: true 
    },
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP