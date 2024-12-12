const Order = require("../models/Order.js");

const createOrder = async (req, res) => {
   try {
    const { orderItems, shippingAddress, totalPrice } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ error: "Order items are required." });
    }
    if (!shippingAddress) {
      return res.status(400).json({ error: "Shipping address is required." });
    }
    if (!totalPrice || totalPrice <= 0) {
      return res.status(400).json({ error: "Total price must be greater than 0." });
    }

    const user = req.user._id;

    const newOrder = new Order({
      user,
      orderItems: orderItems.map(item => ({
        name: item.name,
        qty: item.qty,
        price: item.price,
      })),
      shippingAddress,
      totalPrice,
    });

    await newOrder.save();

    res.status(201).json({
      message: "Order created successfully.",
      order: newOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found." });
    }

    res.status(200).json({
      message: "Orders retrieved successfully.",
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    res.status(200).json({
      message: "Order retrieved successfully.",
      order,
    });
  } catch (error) {
    console.error("Error retrieving order:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const userOrders = await Order.find({ user: userId });

    if (userOrders.length === 0) {
      return res.status(404).json({ message: "No orders found for this user." });
    }

    res.status(200).json({
      message: "User orders retrieved successfully.",
      orders: userOrders,
    });
  } catch (error) {
    console.error("Error retrieving user orders:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

const returnOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.isReturned) {
      return res
        .status(400)
        .json({ message: "Order has already been marked as returned." });
    }

    order.isReturned = true;
    await order.save();

    res.status(200).json({
      message: "Order has been successfully marked as returned.",
      order,
    });
  } catch (error) {
    console.error("Error returning order:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.isCancelled) {
      return res
        .status(400)
        .json({ message: "Order has already been marked as canceled." });
    }

    if (order.isReturned) {
      return res
        .status(400)
        .json({ message: "Returned orders cannot be canceled." });
    }

    if (order.isShipped) {
      return res
        .status(400)
        .json({ message: "Shipped orders cannot be canceled." });
    }

    order.isCancelled = true;
    await order.save();

    res.status(200).json({
      message: "Order has been successfully canceled.",
      order,
    });
  } catch (error) {
    console.error("Error canceling order:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
}



module.exports = { createOrder, getAllOrders, getOrderById, getUserOrders, returnOrder, cancelOrder  };
