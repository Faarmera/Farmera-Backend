const Order = require("../models/Order.js");
const Cart = require("../models/Cart.js");
const Product = require("../models/Product.js")
const mongoose = require("mongoose");
const User = require("../models/User.js")
const { sendEmail } = require("../controllers/emailController.js");

const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const userId = req.user?._id;
    const query = userId ? { user: userId } : { cartId: req.body.cartId };
    const cart = await Cart.findOne(query).populate("cartItems.product").session(session);
    
    if (!cart || cart.cartItems.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Your cart is empty or not found." });
    }

    const orderItems = [];
    const errorMessages = [];
    // Track products by creator for notifications
    const productsByCreator = {};

    for (const cartItem of cart.cartItems) {
      const product = cartItem.product;
      if (!product) {
        errorMessages.push(`Invalid cart item: Product does not exist.`);
        continue;
      }

      const currentProduct = await Product.findById(product._id).session(session);
      if (!currentProduct || currentProduct.qtyAvailable < cartItem.quantity) {
        errorMessages.push(
          `Insufficient stock for product: ${product.name}. Only ${currentProduct?.qtyAvailable || 0} available.`
        );
        continue;
      }

      // Group products by creator for later notification
      if (currentProduct.createdBy) {
        if (!productsByCreator[currentProduct.createdBy]) {
          productsByCreator[currentProduct.createdBy] = [];
        }
        productsByCreator[currentProduct.createdBy].push({
          name: product.name,
          qty: cartItem.quantity,
          price: product.price,
          productId: product._id
        });
      }

      currentProduct.qtyAvailable -= cartItem.quantity;
      await currentProduct.save({ session });
      orderItems.push({
        name: product.name,
        qty: cartItem.quantity,
        price: product.price,
        product: product._id,
      });
    }

    if (errorMessages.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        error: "Some items could not be processed",
        details: errorMessages,
      });
    }

    const totalPrice = orderItems.reduce((acc, item) => acc + item.qty * item.price, 0);
    const newOrder = new Order({
      user: userId || null,
      orderItems,
      shippingAddress: req.body.shippingAddress,
      totalPrice,
    });

    await newOrder.save({ session });
    cart.cartItems = [];
    cart.totalBill = 0;
    await cart.save({ session });
    await session.commitTransaction();

    // Send email to the buyer
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        const orderItemsHtml = orderItems
          .map(
            (item) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.qty}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">₦${item.price}</td>
              </tr>
            `
          )
          .join("");

        const emailContent = `
          <p>Hi ${user.firstname},</p>
          <p>Thank you for your order! Below are your order details:</p>
          <table style="border-collapse: collapse; width: 100%; text-align: left;">
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px;">Item</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Quantity</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Price</th>
            </tr>
            ${orderItemsHtml}
          </table>
          <p><strong>Total Price:</strong> ₦${totalPrice}</p>
          <p><strong>Shipping Address:</strong> ${newOrder.shippingAddress}</p>
          <p>We will notify you when your order is shipped.</p>
          <p>Best regards,<br>The Farmera Team</p>
        `;

        await sendEmail(user.email, "Farmera Order Confirmation", emailContent);
      }
    }

    // Send notifications to each product creator
    const notifyProductCreators = async () => {
      for (const creatorId in productsByCreator) {
        try {
          const creator = await User.findById(creatorId);
          if (creator && creator.email) {
            const products = productsByCreator[creatorId];
            const productsHtml = products
              .map(
                (item) => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.qty}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">₦${item.price}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">₦${item.qty * item.price}</td>
                  </tr>
                `
              )
              .join("");

            const subtotal = products.reduce((acc, item) => acc + (item.qty * item.price), 0);
            const buyer = await User.findById(userId);
            const buyerName = buyer ? `${buyer.firstname} ${buyer.lastname}` : "A customer";
            const buyerPhone = buyer ? buyer.phonenumber : "Not available";

            const creatorEmailContent = `
              <p>Hi ${creator.firstname},</p>
              <p>Good news! ${buyerName} has placed an order for your products.</p>
              <p>The following items will be picked up from your farm in approximately 30 minutes:</p>
              <table style="border-collapse: collapse; width: 100%; text-align: left;">
                <tr>
                  <th style="border: 1px solid #ddd; padding: 8px;">Product</th>
                  <th style="border: 1px solid #ddd; padding: 8px;">Quantity</th>
                  <th style="border: 1px solid #ddd; padding: 8px;">Unit Price</th>
                  <th style="border: 1px solid #ddd; padding: 8px;">Subtotal</th>
                </tr>
                ${productsHtml}
                <tr>
                  <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>Total:</strong></td>
                  <td style="border: 1px solid #ddd; padding: 8px;"><strong>₦${subtotal}</strong></td>
                </tr>
              </table>
              
              <p><strong>Buyer's Phone:</strong> ${buyerPhone}</p>
              <p><strong>Pickup Address:</strong> ${creator.farmAddress || "Your registered farm address"}</p>
              <p>Please have these items ready for pickup. The buyer or our delivery partner will arrive at your location shortly.</p>
              <p>Order ID: ${newOrder._id}</p>
              <p>Best regards,<br>The Farmera Team</p>
            `;

            await sendEmail(creator.email, "Farmera New Order Alert - Products Purchased", creatorEmailContent);
          }
        } catch (error) {
          console.error(`Failed to notify product creator ${creatorId}:`, error);
          // Continue with other notifications even if one fails
        }
      }
    };
    
    // Execute notifications in the background without awaiting
    notifyProductCreators().catch(err => console.error("Error sending creator notifications:", err));

    const populatedOrder = await Order.findById(newOrder._id).populate('orderItems.product');

    res.status(201).json({
      message: "Order created successfully. A confirmation email has been sent.",
      order: populatedOrder,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error creating order:", error.message);
    res.status(500).json({ error: "Internal server error." });
  } finally {
    session.endSession();
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, isPaid, isShipped, isReturned, isCancelled, user, sort = "-createdAt", startDate, endDate, minTotal, maxTotal } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(parseInt(limit), 100));

    const filter = {};

    if (isPaid !== undefined) filter.isPaid = isPaid === "true";
    if (isShipped !== undefined) filter.isShipped = isShipped === "true";
    if (isReturned !== undefined) filter.isReturned = isReturned === "true";
    if (isCancelled !== undefined) filter.isCancelled = isCancelled === "true";

    if (user) filter.user = user;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (minTotal || maxTotal) {
      filter.totalPrice = {};
      if (minTotal) filter.totalPrice.$gte = parseFloat(minTotal);
      if (maxTotal) filter.totalPrice.$lte = parseFloat(maxTotal);
    }

    const orders = await Order.find(filter)
      .populate("user", "name email")
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const totalOrders = await Order.countDocuments(filter);

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found for the given criteria." });
    }

    res.status(200).json({
      message: "Orders retrieved successfully.",
      totalOrders,
      currentPage: pageNum,
      totalPages: Math.ceil(totalOrders / limitNum),
      pageSize: limitNum,
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error.message);

    if (error.name === 'CastError') {
      return res.status(400).json({ error: "Invalid query parameter." });
    }

    res.status(500).json({ error: "Internal server error." });
  }
};

const getUserOrder = async (req, res) => { 
  try {  
    const userId = req.user._id;

    const order = await Order.findOne({ user: userId }).populate("orderItems.product");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const { page = 1, limit = 10, isPaid, isShipped, sort = "-createdAt", startDate, endDate, minTotal, maxTotal } = req.query; 
 
    const pageNum = Math.max(1, parseInt(page)); 
    const limitNum = Math.max(1, Math.min(parseInt(limit), 100));
 
    const userExists = await User.findById(userId); 
    if (!userExists) { 
      return res.status(404).json({ message: "User not found." }); 
    } 
 
    const filter = { 
      user: userId,
      isReturned: false,
      isCancelled: false
    }; 
     
    if (isPaid !== undefined) filter.isPaid = isPaid === "true"; 
    if (isShipped !== undefined) filter.isShipped = isShipped === "true"; 
 
    if (startDate || endDate) { 
      filter.createdAt = {}; 
      if (startDate) filter.createdAt.$gte = new Date(startDate); 
      if (endDate) filter.createdAt.$lte = new Date(endDate); 
    } 
 
    if (minTotal || maxTotal) { 
      filter.totalPrice = {}; 
      if (minTotal) filter.totalPrice.$gte = parseFloat(minTotal); 
      if (maxTotal) filter.totalPrice.$lte = parseFloat(maxTotal); 
    } 
 
    const userOrders = await Order.find(filter) 
      .populate("user", "name email") 
      .populate({ 
        path: 'orderItems.product', 
        select: 'name price' 
      }) 
      .sort(sort) 
      .skip((pageNum - 1) * limitNum) 
      .limit(limitNum); 
 
    const totalOrders = await Order.countDocuments(filter); 
 
    if (userOrders.length === 0) { 
      return res.status(404).json({ message: "No order at the moment." }); 
    } 
 
    res.status(200).json({ 
      message: "User order retrieved successfully.", 
      totalOrders, 
      currentPage: pageNum, 
      totalPages: Math.ceil(totalOrders / limitNum), 
      pageSize: limitNum, 
      orders: userOrders, 
    }); 
  } catch (error) { 
    console.error("Error retrieving user orders:", error.message); 
     
    if (error.name === 'CastError') { 
      return res.status(400).json({ error: "Invalid query parameter." }); 
    } 
 
    res.status(500).json({ error: "Internal server error." }); 
  } 
};

const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("user", "name email") 
      .populate("orderItems.product", "name price description");

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
};

const returnProductFromOrder = async (req, res) => {
  try {
    const { orderId, orderedItemId } = req.params;

    const order = await Order.findById(orderId).populate("orderItems.product");
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const orderedItem = order.orderItems.find((item) => item._id.toString() === orderedItemId);
    if (!orderedItem) {
      return res.status(404).json({ error: "Ordered item not found" });
    }

    if (orderedItem.isReturned) {
      return res.status(400).json({ error: "Item has already been returned" });
    }

    const returnWindowDays = 7;
    const returnDeadline = new Date(order.createdAt);
    returnDeadline.setDate(returnDeadline.getDate() + returnWindowDays);
    const now = new Date();

    if (now > returnDeadline) {
      return res.status(400).json({
        error: `Return period expired. You can only return items within ${returnWindowDays} days.`,
      });
    }

    orderedItem.isReturned = true;
    orderedItem.returnedAt = new Date();

    order.totalPrice -= orderedItem.qty * orderedItem.price;

    const product = orderedItem.product;
    product.qtyAvailable += orderedItem.qty;
    await product.save();

    const allItemsReturned = order.orderItems.every((item) => item.isReturned);
    if (allItemsReturned) {
      order.isReturned = true;
      order.returnedAt = new Date();
    }

    await order.save();

    res.status(200).json({
      message: "Ordered item returned successfully",
      order,
    });
  } catch (error) {
    console.error("Error returning ordered item:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findById(orderId).session(session);

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
        .json({ message: "Shipped orders cannot be canceled. You can return within 7 days after it has reached the designated pickup point" });
    }

    if (!isWithinCancellationWindow(order.createdAt)) {
      return res
        .status(400)
        .json({ message: "Order is no longer eligible for cancellation. An order can only be cancelled within 24 hours of purchase" });
    }

    order.isCancelled = true;
    order.cancelledAt = new Date();
    order.cancelledBy = userId;

    for (const item of order.orderItems) {
      const product = await Product.findById(item.product).session(session);

      if (!product) {
        console.warn(`Product with ID ${item.product} not found.`);
        continue;
      }

      if (typeof product.qtyAvailable !== "number") {
        console.warn(
          `Product with ID ${item.product} has an invalid qtyAvailable value: ${product.qtyAvailable}`
        );
        continue;
      }

      const qtyToAdd = item.qty || 0;
      if (typeof qtyToAdd !== "number" || qtyToAdd < 0) {
        console.warn(
          `Invalid quantity for product ID ${item.product}: ${qtyToAdd}`
        );
        continue;
      }

      product.qtyAvailable += qtyToAdd;
      await product.save({ session });
    }

    await order.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      message: "Order has been successfully canceled.",
      order,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error canceling order:", error.message);
    res.status(500).json({ error: "Internal server error." });
  } finally {
    session.endSession();
  }
};

function isWithinReturnWindow(orderDate) {
  const returnWindow = 7 * 24 * 60 * 60 * 1000;
  return (Date.now() - new Date(orderDate).getTime()) <= returnWindow;
}

function isWithinCancellationWindow(orderDate) {
  const cancellationWindow = 24 * 60 * 60 * 1000;
  return (Date.now() - new Date(orderDate).getTime()) <= cancellationWindow;
}


module.exports = { createOrder, getAllOrders, getOrderById, getUserOrder, returnProductFromOrder, cancelOrder  };
