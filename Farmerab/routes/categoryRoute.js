const express = require("express");
const { createCategory, getAllCategories, getCategoryByName, updateCategory, deleteCategory } = require("../controllers/categoryController.js");
const { protectRoute } = require("../middlewares/protectRoute.js");
const authorize = require('../middlewares/roleCheckMiddleware.js');
const router = express.Router();

router.post("/create", protectRoute, authorize(['admin']), createCategory);
router.get("/get/allCategories", protectRoute, authorize(['admin', `buyer`, `farmer`]), getAllCategories);
router.get("/get/:name",  protectRoute, authorize(['admin', `buyer`, `farmer`]), getCategoryByName);
router.put("/update/:id", protectRoute, authorize(['admin']), updateCategory);
router.delete("/delete/:id", protectRoute, authorize(['admin']), deleteCategory);

module.exports = router;