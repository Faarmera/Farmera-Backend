const express = require("express");
const { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory } = require("../controllers/categoryController.js");
const { protectRoute } = require("../middlewares/protectRoute.js");
const authorize = require('../middlewares/roleCheckMiddleware.js');
const router = express.Router();

router.post("/create", protectRoute, authorize(['admin']), createCategory);
router.get("/get/allCategories", protectRoute, authorize(['admin', `buyer`, `farmer`]), getAllCategories);
router.get("/get/:id", authorize(['admin', `buyer`, `farmer`]), getCategoryById);
router.put("/update/:id", protectRoute, authorize(['admin']), updateCategory);
router.delete("/delete/:id", protectRoute, authorize(['admin']), deleteCategory);

module.exports = router;