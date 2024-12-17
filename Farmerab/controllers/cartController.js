const Cart = require("../models/Cart.js");
const Product = require("../models/Product.js")

const getUserCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId }).populate("cartItems.product", "name price description");

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
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ error: "Product ID and quantity are required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        cartItems: [],
      });
    }

    const existingCartItem = cart.cartItems.find(
      (item) => item.product.toString() === productId
    );

    if (existingCartItem) {
      existingCartItem.quantity += quantity;
      existingCartItem.Price = existingCartItem.quantity * product.price;
    } else {
      cart.cartItems.push({
        product: productId,
        quantity,
        Price: quantity * product.price,
      });
    }

    await cart.save();

    res.status(200).json({ message: "Product added to cart successfully", cart });
  } catch (error) {
    console.error("Error adding to cart:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const decreaseProductFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const cart = await Cart.findOne({ user: userId });
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
    cartItem.quantity -= 1;

    if (cartItem.quantity <= 0) {
      cart.cartItems.splice(itemIndex, 1);
    } else {
      const product = await Product.findById(productId);
      cartItem.Price = cartItem.quantity * product.price;
    }

    await cart.save();

    res.status(200).json({
      message: "1 unit removed from the product in cart successfully",
      cart,
    });
  } catch (error) {
    console.error("Error decreasing cart item quantity:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteProductFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const itemIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: "Product not found in cart" });
    }

    cart.cartItems.splice(itemIndex, 1);

    await cart.save();

    res.status(200).json({
      message: "Product removed from cart successfully",
      cart,
    });
  } catch (error) {
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
      .populate("user", "name email")
      .populate("cartItems.product", "name price");

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
