const express = require("express");
const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getMyProducts } = require("../controllers/productController.js");
const upload = require("../config/multer.js")
const {protectRoute} = require("../middlewares/protectRoute.js")
const router = express.Router();

router.get("/get/allProducts", getAllProducts);
router.get("/get/:id", getProductById);
router.post("/create", upload, createProduct);
router.put("/update/:id", upload/*.array("images", 10)*/, updateProduct);
router.delete("/delete/:id", deleteProduct);
router.get("/get/myProducts", protectRoute, getMyProducts);

module.exports = router;
