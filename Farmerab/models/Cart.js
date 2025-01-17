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
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

cartSchema.index(
  { cartId: 1 }, 
  { 
    unique: true,
    sparse: true,
    partialFilterExpression: { cartId: { $exists: true, $ne: null } }
  }
);

cartSchema.index(
  { user: 1 }, 
  { 
    unique: true,
    sparse: true,
    partialFilterExpression: { user: { $exists: true, $ne: null } }
  }
);

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
