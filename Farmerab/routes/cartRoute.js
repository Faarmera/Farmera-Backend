const express = require("express");
const { getUserCart, getAllCarts, addToCart, decreaseProductFromCart , deleteProductFromCart, clearCart  } = require("../controllers/cartController.js");
const { protectRoute} = require("../middlewares/protectRoute.js");
const authorize = require('../middlewares/roleCheckMiddleware.js')
const router = express.Router();

router.get("/user", protectRoute, getUserCart);
router.get("/get/allCarts", authorize(['admin']), getAllCarts)
router.post("/add", protectRoute, addToCart);
router.delete("/delete" , protectRoute, deleteProductFromCart )
router.patch("/decrease" , protectRoute, decreaseProductFromCart )
router.delete("/clear" , protectRoute, clearCart )

module.exports = router;
