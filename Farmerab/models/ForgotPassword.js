const mongoose = require("mongoose")

const forgotPasswordSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    }
})

forgotPasswordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ForgotPassword = mongoose.model("ForgotPassword", forgotPasswordSchema)

module.exports = ForgotPassword