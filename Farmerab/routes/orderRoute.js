const express = require("express");
const { createOrder, getAllOrders, getOrderById, getUserOrders, returnOrder, cancelOrder } = require("../controllers/orderController.js");
const { protectRoute } = require("../middlewares/protectRoute.js");

const router = express.Router();

router.post("/create", protectRoute, createOrder);
router.get("/get/allOrders", protectRoute, getAllOrders);
router.get("/get/:orderId", protectRoute, getOrderById);
router.get("/get/:userId", protectRoute, getUserOrders);
router.put("/return/:orderId", protectRoute, returnOrder);
router.put("/cancel/:orderId", protectRoute, cancelOrder);

module.exports = router;
