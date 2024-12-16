const express = require("express");
const { getUserCart, getAllCarts, addToCart, deleteFromCart } = require("../controllers/cartController.js");
const { protectRoute} = require("../middlewares/protectRoute.js");
const authorize = require('../middlewares/roleCheckMiddleware.js')
const router = express.Router();

router.get("/:id", protectRoute, authorize(['admin', `buyer`, `farmer`]), getUserCart);
router.get("/allCarts", protectRoute, authorize(['admin', `buyer`, `farmer`]), getAllCarts)
router.post("/add", authorize(['admin', `buyer`, `farmer`]), addToCart);
router.put("/cart/:cartId/product/:productId", authorize(['admin', `buyer`, `farmer`]), deleteFromCart);

module.exports = router;
