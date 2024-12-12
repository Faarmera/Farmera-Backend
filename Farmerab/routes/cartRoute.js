const express = require("express");
const { getUserCart, getAllCarts, addToCart, deleteFromCart } = require("../controllers/cartController.js");
const { protectRoute} = require("../middlewares/protectRoute.js");

const router = express.Router();

router.get("/:id", protectRoute, getUserCart);
router.get("/allCarts", protectRoute, getAllCarts)
router.post("/add", addToCart);
router.put("/cart/:cartId/product/:productId", deleteFromCart);

module.exports = router;
