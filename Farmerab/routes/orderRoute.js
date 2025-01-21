const express = require("express");
const { createOrder, getAllOrders, getOrderById, getUserOrder, returnProductFromOrder, cancelOrder, createGuestOrder } = require("../controllers/orderController.js");
const { protectRoute } = require("../middlewares/protectRoute.js");
const authorize = require('../middlewares/roleCheckMiddleware.js');
const router = express.Router();

router.post("/add", protectRoute, createOrder);
router.post("/guestAdd", createGuestOrder);
router.get("/get/allOrders", protectRoute, authorize(['admin']), getAllOrders);
router.get("/get/:orderId", protectRoute, authorize(['admin']), getOrderById);
router.get("/user", protectRoute, getUserOrder);
router.post("/:orderId/product/:orderedItemId/return", protectRoute, returnProductFromOrder);
router.put("/:orderId/cancel", protectRoute, cancelOrder);

module.exports = router;