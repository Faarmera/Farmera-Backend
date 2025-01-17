const express = require("express");
const { getUserCart, getAllCarts, addToCart, decreaseProductFromCart , deleteProductFromCart, clearCart, mergeCartsAfterLogin  } = require("../controllers/cartController.js");
const { protectRoute} = require("../middlewares/protectRoute.js");
const authorize = require('../middlewares/roleCheckMiddleware.js')
const router = express.Router();

router.get("/user", getUserCart);
router.get("/get/allCarts", authorize(['admin']), getAllCarts);
router.post("/add", addToCart);
router.patch("/decrease", decreaseProductFromCart);
router.delete("/delete", deleteProductFromCart);
router.delete("/clear", clearCart);
router.post("/merge", protectRoute, mergeCartsAfterLogin);

module.exports = router;
