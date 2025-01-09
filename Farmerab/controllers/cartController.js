const Cart = require("../models/Cart.js");
const Product = require("../models/Product.js")
const User = require("../models/User.js")
const mongoose = require('mongoose');

const getUserCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId }).populate("cartItems.product");

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    res.status(200).json(cart);
  } catch (error) {
    console.error("Error retrieving user cart:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const addToCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "No products provided to add to cart." });
    }

    let cart = await Cart.findOne({ user: userId }).session(session);

    if (!cart) {
      cart = new Cart({
        user: userId,
        cartItems: [],
        totalBill: 0,
      });
    }

    let totalBill = cart.totalBill;
    const errorMessages = [];

    for (const productItem of products) {
      const { productId, quantity } = productItem;

      if (!productId || quantity <= 0) {
        await session.abortTransaction();
        return res.status(400).json({ error: "Valid product ID and quantity are required." });
      }

      const foundProduct = await Product.findById(productId).session(session);
      if (!foundProduct) {
        errorMessages.push(`Product with ID ${productId} does not exist.`);
        continue;
      }

      if (quantity > foundProduct.qtyAvailable) {
        errorMessages.push(
          `Product with ID ${productId} is out of stock. Only ${foundProduct.qtyAvailable} units available.`
        );
        continue;
      }

      foundProduct.qtyAvailable -= quantity;
      await foundProduct.save({ session });

      const productBill = foundProduct.price * quantity;

      const existingCartItem = cart.cartItems.find(
        (cartItem) => cartItem.product.toString() === productId
      );

      if (existingCartItem) {
        existingCartItem.quantity += quantity;
        existingCartItem.price = existingCartItem.quantity * foundProduct.price;
      } else {
        cart.cartItems.push({
          product: productId,
          quantity,
          price: productBill,
        });
      }

      totalBill += productBill;
    }

    cart.totalBill = totalBill;
    await cart.save({ session });

    if (errorMessages.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Some items could not be added.", details: errorMessages });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Items added to cart successfully.",
      cart,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error adding to cart:", error.message);
    return res.status(500).json({ error: "An error occurred while adding items to the cart." });
  }
};

const decreaseProductFromCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { productId } = req.body;


    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const cart = await Cart.findOne({ user: userId }).session(session);

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const itemIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: "Product not found in cart" });
    }

    const cartItem = cart.cartItems[itemIndex];
    const product = await Product.findById(productId).session(session);

    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Product not found" });
    }

    cartItem.quantity -= 1;

    if (cartItem.quantity <= 0) {
      cart.cartItems.splice(itemIndex, 1);
    } else {
      cartItem.price = cartItem.quantity * product.price;
    }

    cart.totalBill = cart.cartItems.reduce((total, item) => total + item.price, 0);

    product.qtyAvailable += 1;
    await product.save({ session });

    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "1 unit removed from the product in cart successfully",
      cart,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error decreasing cart item quantity:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteProductFromCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { productId } = req.body;

    console.log(productId)

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const cart = await Cart.findOne({ user: userId }).session(session);
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const itemIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: "Product not found in cart" });
    }

    const cartItemToRemove = cart.cartItems[itemIndex];
    
    const product = await Product.findById(productId).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Product not found" });
    }

    product.qtyAvailable += cartItemToRemove.quantity;
    await product.save({ session });

    cart.cartItems.splice(itemIndex, 1);

    cart.totalBill = cart.cartItems.reduce((total, item) => total + item.price, 0);

    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Product removed from cart successfully",
      cart,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error removing product from cart:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    cart.cartItems = [];
    cart.totalBill = 0

    await cart.save();

    res.status(200).json({
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    console.error("Error clearing cart:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAllCarts = async  (req, res ) => {
  try {
    const carts = await Cart.find()
      .populate("user", "-password")
      .populate("cartItems.product");

    if (!carts || carts.length === 0) {
      return res.status(404).json({ message: "No carts found" });
    }

    res.status(200).json({ message: "Carts retrieved successfully", carts });
  } catch (error) {
    console.error("Error retrieving carts:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getUserCart, getAllCarts, addToCart, deleteProductFromCart,  decreaseProductFromCart, clearCart  };
