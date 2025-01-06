const express = require("express");
const { createCategory, getAllCategories, getCategoryByName, updateCategory, deleteCategory } = require("../controllers/categoryController.js");
const { protectRoute } = require("../middlewares/protectRoute.js");
const authorize = require('../middlewares/roleCheckMiddleware.js');
const router = express.Router();

router.post("/create", authorize(['admin']), createCategory);
router.get("/get/allCategories", getAllCategories);
router.get("/get/:name", getCategoryByName);
router.put("/update/:id", authorize(['admin']), updateCategory);
router.delete("/delete/:id", authorize(['admin']), deleteCategory);

module.exports = router;