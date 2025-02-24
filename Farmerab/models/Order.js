const mongoose = require("mongoose");

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        qty: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        isReturned: {
          type: Boolean,
          default: false,
        },
        returnedAt: Date,
      },
    ],
    shippingAddress: {
      type: String,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isReturned: {
      type: Boolean,
      default: false,
    },
    returnedAt: Date,
    isCancelled: {
      type: Boolean,
      default: false,
    },
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isShipped: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
