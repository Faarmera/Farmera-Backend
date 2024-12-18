const express = require("express");
const { getUserCart, getAllCarts, addToCart, decreaseProductFromCart , deleteProductFromCart, clearCart  } = require("../controllers/cartController.js");
const { protectRoute} = require("../middlewares/protectRoute.js");
const authorize = require('../middlewares/roleCheckMiddleware.js')
const router = express.Router();

router.get("/user", protectRoute, authorize(['admin', `buyer`, `farmer`]), getUserCart);
router.get("/get/allCarts", protectRoute, authorize(['admin']), getAllCarts)
router.post("/add", protectRoute, authorize(['admin', `buyer`, `farmer`]), addToCart);
router.delete("/delete" , protectRoute, authorize(['admin', `buyer`, `farmer`]), deleteProductFromCart )
router.patch("/decrease" , protectRoute, authorize(['admin', `buyer`, `farmer`]), decreaseProductFromCart )
router.delete("/clear" , protectRoute, authorize(['admin', `buyer`, `farmer`]), clearCart )

module.exports = router;
