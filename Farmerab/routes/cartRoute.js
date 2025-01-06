const express = require("express");
const { getUserCart, getAllCarts, addToCart, decreaseProductFromCart , deleteProductFromCart, clearCart  } = require("../controllers/cartController.js");
const { protectRoute} = require("../middlewares/protectRoute.js");
const authorize = require('../middlewares/roleCheckMiddleware.js')
const router = express.Router();

router.get("/user", authorize(['admin', `buyer`, `farmer`]), getUserCart);
router.get("/get/allCarts", authorize(['admin']), getAllCarts)
router.post("/add", authorize(['admin', `buyer`, `farmer`]), addToCart);
router.delete("/delete" , authorize(['admin', `buyer`, `farmer`]), deleteProductFromCart )
router.patch("/decrease" , authorize(['admin', `buyer`, `farmer`]), decreaseProductFromCart )
router.delete("/clear" , authorize(['admin', `buyer`, `farmer`]), clearCart )

module.exports = router;
