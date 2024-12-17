const Category = require("../models/Category.js");
const Product = require("../models/Product.js")
const mongoose = require("mongoose")

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const newCategory = new Category({ name });
    await newCategory.save();

    res.status(201).json({ 
      message: "Category created successfully", 
      category: newCategory 
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Error creating category", error: error.message });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate({
      path: 'products',
      model: 'Product',
      populate: {
        path: 'category',
        model: 'Category',
        select: 'name'
      }
    });

    if (!categories || categories.length === 0) {
      return res.status(404).json({ message: "No categories found" });
    }
    
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error in getAllCategories:", error);
    res.status(500).json({
      message: "Error retrieving categories",
      error: error.message
    });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id)
      .populate({
        path: 'products',
        model: 'Product',
        populate: {
          path: 'category',
          model: 'Category',
          select: 'name'
        }
      });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    res.status(200).json(category);
  } catch (error) {
    console.error("Error in getCategoryById:", error);
    res.status(500).json({
      message: "Error retrieving category",
      error: error.message
    });
  }
};

const updateCategory = async (req, res) => {
  try {
      const { id } = req.params;
      const { name } = req.body;

      if (!name) {
          return res.status(400).json({ error: "Category name is required" });
      }

      const updatedCategory = await Category.findByIdAndUpdate(
          id,
          {
              ...(name && { name }),
          },
          { new: true }
      );

      if (!updatedCategory) {
          return res.status(404).json({ error: "Category not found." });
      }

      res.status(200).json({
          message: "Category updated successfully.",
          category: updatedCategory,
      });
  } catch (error) {
      console.error("Error updating category:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
  }
};

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