const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    transactionRef: { 
      type: String, 
      required: true, 
      unique: true 
    },
    providerRef: String,
    amount: { 
      type: Number, 
      required: true 
    },
    currency: { 
      type: String, 
      default: 'NGN' 
    },
    provider: { 
      type: String, 
      required: true 
    },
    customerId: { 
      type: String, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED'],
      default: 'PENDING' 
    },
    metadata: Object,
    paymentMethod: String,
    errorMessage: String,
    verificationAttempts: { 
      type: Number, 
      default: 0 
    },
    lastVerificationAt: Date,
    completedAt: Date,
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
    updatedAt: Date
  });
  
  paymentSchema.index({ transactionRef: 1, status: 1 });
  paymentSchema.index({ customerId: 1, createdAt: -1 });

  const Payment = mongoose.model("Payment", paymentSchema);
  
  module.exports = Payment;