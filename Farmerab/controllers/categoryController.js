const Category = require("../models/Category.js");

const createCategory = async (req, res) => {
    try {
        const { name, productId } = req.body;
    
        if (!name || !productId) {
          return res.status(400).json({ error: "Name and productId are required" });
        }
    
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ error: "Product not found" });
        }
    
        const newCategory = new Category({
          name,
          Product: product._id,
        });
    
        await newCategory.save();
    
        res.status(201).json({ message: "Category created successfully", category: newCategory });
      } catch (error) {
        console.error("Error creating category:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
      }
}

const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().populate("Product", "name price description");
    
        res.status(200).json({
          message: "Categories retrieved successfully",
          categories,
        });
      } catch (error) {
        console.error("Error retrieving categories:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
    
        const category = await Category.findById(id).populate("Product", "name price description");
    
        if (!category) {
          return res.status(404).json({ error: "Category not found" });
        }
    
        res.status(200).json({
          message: "Category retrieved successfully",
          category,
        });
      } catch (error) {
        console.error("Error retrieving category:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, productId } = req.body;
    
        if (!name && !productId) {
          return res.status(400).json({ error: "At least one field (name or productId) is required to update." });
        }
    
        const updatedCategory = await Category.findByIdAndUpdate(
          id,
          {
            ...(name && { name }),
            ...(productId && { Product: productId }),
          },
          { new: true }
        ).populate("Product", "name price description");
    
        if (!updatedCategory) {
          return res.status(404).json({ error: "Category not found" });
        }
    
        res.status(200).json({
          message: "Category updated successfully",
          category: updatedCategory,
        });
      } catch (error) {
        console.error("Error updating category:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
    
        const deletedCategory = await Category.findByIdAndDelete(id);
    
        if (!deletedCategory) {
          return res.status(404).json({ error: "Category not found" });
        }
    
        res.status(200).json({
          message: "Category deleted successfully",
          category: deletedCategory,
        });
      } catch (error) {
        console.error("Error deleting category:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = {
  createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory 
} 