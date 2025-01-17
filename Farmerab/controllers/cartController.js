const Cart = require("../models/Cart.js");
const Product = require("../models/Product.js")
const User = require("../models/User.js")
const mongoose = require('mongoose');

const getUserCart = async (req, res) => {
  try {
    const cartId = req.headers['x-cart-id'];
    const isAuthenticated = req.user !== undefined;

    const cart = isAuthenticated
      ? await Cart.findOne({ user: req.user._id }).populate("cartItems.product")
      : await Cart.findOne({ cartId: cartId, user: null }).populate("cartItems.product");

      console.log("Fetched Cart:", cart);

    if (!cart) {
      if (!isAuthenticated) {
        return res.status(200).json({
          cartItems: [],
          totalBill: 0,
          cartId: cartId
        });
      }
      return res.status(404).json({ error: "Cart not found" });
    }

    res.status(200).json(cart);
  } catch (error) {
    console.error("Error retrieving cart:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const addToCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const cartId = req.headers['x-cart-id'] || generateCartId();
    const isAuthenticated = req.user !== undefined;
    
    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "No products provided to add to cart." });
    }

    let cart = isAuthenticated 
      ? await Cart.findOne({ user: req.user._id }).session(session)
      : await Cart.findOne({ cartId: cartId, user: null }).session(session);

    if (!cart) {
      cart = new Cart({
        cartId: cartId,
        user: isAuthenticated ? req.user._id : null,
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
      cartId: !isAuthenticated ? cartId : undefined
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error adding to cart:", error.message);
    return res.status(500).json({ error: "An error occurred while adding items to the cart." });
  }
};

function generateCartId() {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

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

const decreaseProductFromCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const cartId = req.headers['x-cart-id'];
    const isAuthenticated = req.user !== undefined;

    const cart = isAuthenticated 
      ? await Cart.findOne({ user: req.user._id }).session(session)
      : await Cart.findOne({ cartId: cartId, user: null }).session(session);

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
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
    const cartId = req.headers['x-cart-id'];
    const isAuthenticated = req.user !== undefined;
    
    const cart = isAuthenticated 
      ? await Cart.findOne({ user: req.user._id }).session(session)
      : await Cart.findOne({ cartId: cartId, user: null }).session(session);

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const cartId = req.headers['x-cart-id'];
    const isAuthenticated = req.user !== undefined;
    
    const cart = isAuthenticated 
      ? await Cart.findOne({ user: req.user._id }).session(session)
      : await Cart.findOne({ cartId: cartId, user: null }).session(session);

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    cart.cartItems = [];
    cart.totalBill = 0;
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error clearing cart:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const mergeCartsAfterLogin = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { cartId } = req.body;
    if (!cartId) {
      return res.status(400).json({ error: "Guest cart ID is required" });
    }
    
    const guestCart = await Cart.findOne({ cartId, user: null })
      .populate("cartItems.product")
      .session(session);
      
    if (!guestCart) {
      return res.status(404).json({ error: "Guest cart not found" });
    }
    
    let userCart = await Cart.findOne({ user: req.user._id })
      .populate("cartItems.product")
      .session(session);
      
    if (!userCart) {
      userCart = new Cart({
        user: req.user._id,
        cartItems: [],
        totalBill: 0
      });
    }

    console.log("Guest Cart:", guestCart);
    console.log("User Cart after merge:", userCart);

    for (const item of guestCart.cartItems) {
      const existingItem = userCart.cartItems.find(
        cartItem => cartItem.product.toString() === item.product.toString()
      );

      if (existingItem) {
        existingItem.quantity += item.quantity;
        existingItem.price = existingItem.quantity * item.price;
      } else {
        userCart.cartItems.push(item);
      }
    }

    userCart.totalBill = userCart.cartItems.reduce((total, item) => total + item.price, 0);

    await Cart.deleteOne({ _id: guestCart._id }).session(session);
    await userCart.save({ session });

    console.log("User Cart saved:", userCart);

    const populatedUserCart = await Cart.findById(userCart._id)
      .populate("cartItems.product");

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Carts merged successfully",
      cart: populatedUserCart
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error merging carts:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getUserCart, getAllCarts, addToCart, deleteProductFromCart,  decreaseProductFromCart, clearCart, mergeCartsAfterLogin  };
