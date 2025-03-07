const express = require("express");
const { getGuestUserCart, clearSignedInUserCart, getSignedInUserCart, getAllCarts, guestAddToCart, userAddToCart, decreaseGuestProductFromCart, decreaseSignedInProductFromCart, deleteSignedInProductFromCart, deleteGuestProductFromCart, clearGuestUserCart, mergeCartsAfterLogin  } = require("../controllers/cartController.js");
const { protectRoute} = require("../middlewares/protectRoute.js");
const authorize = require('../middlewares/roleCheckMiddleware.js')
const router = express.Router();

router.get("/user", protectRoute, getSignedInUserCart);
router.get("/guestUser", getGuestUserCart);
router.get("/get/allCarts", protectRoute, authorize(['admin']), getAllCarts);
router.post("/guestAdd", guestAddToCart);
router.post("/add", protectRoute, userAddToCart);
router.patch("/decrease", protectRoute, decreaseSignedInProductFromCart);
router.patch("/guestDecrease", decreaseGuestProductFromCart);
router.delete("/delete", protectRoute, deleteSignedInProductFromCart);
router.delete("/guestDelete", deleteGuestProductFromCart);
router.delete("/clear", protectRoute, clearSignedInUserCart);
router.delete("/guestClear", clearGuestUserCart);
router.post("/merge", protectRoute, mergeCartsAfterLogin);

module.exports = router;
