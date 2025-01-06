const express = require("express");
const { getUserCart, getAllCarts, addToCart, decreaseProductFromCart , deleteProductFromCart, clearCart  } = require("../controllers/cartController.js");
const { protectRoute} = require("../middlewares/protectRoute.js");
const authorize = require('../middlewares/roleCheckMiddleware.js')
const router = express.Router();

router.get("/user", getUserCart);
router.get("/get/allCarts", authorize(['admin']), getAllCarts)
router.post("/add", addToCart);
router.delete("/delete" , deleteProductFromCart )
router.patch("/decrease" , decreaseProductFromCart )
router.delete("/clear" , clearCart )

module.exports = router;
