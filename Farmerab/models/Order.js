const mongoose = require("mongoose");

const orderSchema = mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    orderItems: [
      {
        name: { 
          type: String, 
          required: true 
        },
        qty: { 
          type: Number, 
          required: true 
        },
        price: { 
          type: Number, 
          required: true 
        },
      },
    ],
    shippingAddress: { 
      type: String, 
      required: true 
    },
    totalPrice: { 
      type: Number, 
      required: true 
    },
    isPaid: { 
      type: Boolean, 
      default: false,
    },
    isReturned: { 
      type: Boolean, 
      default: false 
    },
    isCancelled: { 
      type: Boolean, 
      default: false 
    },
    isShipped: {
      type: Boolean,
      default: false,
    }
  },
    { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
