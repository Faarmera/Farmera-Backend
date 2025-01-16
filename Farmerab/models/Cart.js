const mongoose = require("mongoose");

const CartItemSchema = mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
});

const cartSchema = mongoose.Schema(
  {
    cartId: { 
      type: String,
      sparse: true, 
      unique: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: false, 
    },
    cartItems: [CartItemSchema],
    totalBill: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

cartSchema.index({ 
  cartId: 1, 
  user: 1 
}, { 
  unique: true,
  sparse: true,
  partialFilterExpression: {
    $or: [
      { cartId: { $exists: true } },
      { user: { $exists: true } }
    ]
  }
});

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
