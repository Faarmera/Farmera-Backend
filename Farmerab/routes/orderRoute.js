const express = require("express");
const { createOrder, getAllOrders, getOrderById, getUserOrder, returnOrder, cancelOrder } = require("../controllers/orderController.js");
const { protectRoute } = require("../middlewares/protectRoute.js");
const authorize = require('../middlewares/roleCheckMiddleware.js');

const router = express.Router();

router.post("/add", protectRoute, authorize(['admin', `buyer`, `farmer`]), createOrder);
router.get("/get/allOrders", protectRoute, authorize(['admin']), getAllOrders);
router.get("/get/:orderId", protectRoute, authorize(['admin']), getOrderById);
router.get("/get/user/:userId", protectRoute, authorize(['admin']), getUserOrder);
router.put("/return/:orderId", protectRoute, authorize(['admin', `buyer`, `farmer`]), returnOrder);
router.put("/cancel/:orderId", protectRoute, authorize(['admin', `buyer`, `farmer`]), cancelOrder);

module.exports = router;
