const express = require("express");
const { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory } = require("../controllers/categoryController.js");
const { protectRoute } = require("../middlewares/protectRoute.js");
const authorize = require('../middlewares/roleCheckMiddleware.js');
const router = express.Router();

router.post("/create", protectRoute, authorize(['admin']), createCategory);
router.get("/allCategories", getAllCategories);
router.get("/:id", getCategoryById);
router.put("/update/:id", updateCategory);
router.delete("/delete/:id", deleteCategory);

module.exports = router;