const express = require("express");
const { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory } = require("../controllers/categoryController.js");
const { protectRoute } = require("../middlewares/protectRoute.js");

const router = express.Router();

router.post("/create", createCategory);
router.get("/allCategories", getAllCategories);
router.get("/:id", getCategoryById);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;