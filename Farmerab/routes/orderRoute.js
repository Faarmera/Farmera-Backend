const express = require("express");
const { createOrder, getAllOrders, getOrderById, getUserOrders, returnOrder, cancelOrder } = require("../controllers/orderController.js");
const { protectRoute } = require("../middlewares/protectRoute.js");

const router = express.Router();

router.post("/create", protectRoute, createOrder);
router.get("/allOrders", protectRoute, getAllOrders);
router.get("/:orderId", protectRoute, getOrderById);
router.get("/:userId", protectRoute, getUserOrders);
router.put("/:orderId/return", protectRoute, returnOrder);
router.put("/:orderId/cancel", protectRoute, cancelOrder);

module.exports = router;
