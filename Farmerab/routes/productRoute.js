const express = require("express");
const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } = require("../controllers/productController.js");
const upload = require("../config/multer.js")
const router = express.Router();

router.get("/allProducts", getAllProducts);
router.get("/:id", getProductById);
router.post("/create", upload, createProduct);
router.put("/upload/:id", upload/*.array("images", 10)*/, updateProduct);
router.delete("/delete/:id", deleteProduct);

module.exports = router;
