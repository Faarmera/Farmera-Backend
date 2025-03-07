const Product = require("../models/Product.js");
const Category = require("../models/Category.js")
const User = require("../models/User.js")
const Cloudinary = require("../config/cloudinary.js");
const mongoose = require("mongoose");
const fs = require("fs");

const getAllProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, location, search, page = 1, limit = 12 } = req.query;
   
    const filter = {
      qtyAvailable: { $gt: 0 }
    };
   
    if (category) {
      const categoryDoc = await Category.findOne({ name: category });
      if (categoryDoc) {
        filter.category = categoryDoc._id;
      }
    }
   
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
   
    if (location) {
      filter.location = location;
    }
   
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { store: searchRegex }
      ];
    }
   
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: {
        path: 'category',
        select: 'name'
      }
    };
   
    const result = await Product.paginate(filter, options);
   
    res.status(200).json({
      products: result.docs,
      totalProducts: result.totalDocs,
      totalPages: result.totalPages,
      currentPage: result.page
    });
   
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate({
        path: 'category',
        select: 'name'
      });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createProduct = async (req, res) => {
  try {
    const userId = req.user._id;

    let user = await User.findById(userId);
    if (!user){
      return res.status(404).json({ message: "User not found"})
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "At least one image is required" });
    }

    const { name, qtyAvailable, category, price, description } = req.body;

    if (!name || !category || !price || !qtyAvailable || !description) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (price <= 0 || qtyAvailable < 0) {
      return res.status(400).json({ error: "Invalid price or quantity available" });
    }

    const categoryDoc = await Category.findOne({ name: category });
    if (!categoryDoc) {
      return res.status(400).json({ error: "Category does not exist. Create the category first." });
    }

    const uploadImages = async (files) => {
      const images = [];
      const imageIds = [];
      for (const file of files) {
        if (!file.path) throw new Error("Invalid file or missing file path");
        const result = await Cloudinary.uploader.upload(file.path, { folder: "products" });
        images.push(result.secure_url);
        imageIds.push(result.public_id);
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
      return { images, imageIds };
    };

    const { images, imageIds } = await uploadImages(req.files);

    const newProduct = new Product({
      name,
      store: user.farmAddress,
      qtyAvailable,
      category: categoryDoc._id,
      price,
      location: user.state,
      description,
      images,
      imageIds,
      createdBy: req.user._id,
    });

    await newProduct.save();

    categoryDoc.products.push(newProduct._id);
    await categoryDoc.save();

    res.status(201).json({
      message: "Product created successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("Error creating Product:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, store, qtyAvailable, category, price, location, description } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (req.files && req.files.length > 0) {
      for (const imageId of product.imageIds) {
        await Cloudinary.uploader.destroy(imageId);
      }

      const images = [];
      const imageIds = [];

      for (const file of req.files) {
        const result = await Cloudinary.uploader.upload(file.path, {
          folder: "products",
        });

        images.push(result.secure_url);
        imageIds.push(result.public_id);

        fs.unlinkSync(file.path);
      }

      product.images = images;
      product.imageIds = imageIds;
    }

    if (name) product.name = name;
    if (store) product.store = store;
    if (qtyAvailable) product.qtyAvailable = qtyAvailable;
    if (category) {
      if (typeof category === 'string') {
        const categoryDoc = await Category.findOne({ name: category });
        if (!categoryDoc) {
          return res.status(400).json({ error: `Category '${category}' not found` });
        }
        product.category = categoryDoc._id;
      } else {
        product.category = category;
      }
    }
    if (price) product.price = price;
    if (location) product.location = location;
    if (description) product.description = description;

    await product.save();
    
    await product.populate('category');

    res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error("Error updatinProduct:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// const updateProduct = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, store, qtyAvailable, category, price, location, description } = req.body;
    
//     const product = await Product.findById(id);
//     if (!product) {
//       return res.status(404).json({ error: "Product not found" });
//     }

//     if (req.file) {
//       if (product.imageId) {
//         await Cloudinary.uploader.destroy(product.imageId);
//       }
//       const result = await Cloudinary.uploader.upload(req.file.path, {
//         folder: "products",
//       });
//       product.image = result.secure_url;
//       product.imageId = result.public_id;
//       fs.unlinkSync(req.file.path);
//     }

//     if (name) product.name = name;
//     if (store) product.store = store;
//     if (qtyAvailable) product.qtyAvailable = qtyAvailable;
//     if (category) {
//       if (typeof category === 'string') {
//         const categoryDoc = await Category.findOne({ name: category });
//         if (!categoryDoc) {
//           return res.status(400).json({ error: `Category '${category}' not found` });
//         }
//         product.category = categoryDoc._id;
//       } else {
//         product.category = category;
//       }
//     }
//     if (price) product.price = price;
//     if (location) product.location = location;
//     if (description) product.description = description;

//     await product.save();
    
//     await product.populate('category');
//     res.status(200).json({ message: "Product updated successfully", product });
//   } catch (error) {
//     console.error("Error updating Product:", error.message);
//     res.status(400).json({ error: error.message });
//   }
// };

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    for (const imageId of product.imageIds) {
      await Cloudinary.uploader.destroy(imageId);
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({ message: "Product deleted successfully", Product });
  } catch (error) {
    console.error("Error deleting product:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getMyProducts = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('User ID:', userId);

    if (!userId) {
      console.log("UserId not found")
      return res.status(400).json({ error: "User ID not found" });
    }

    const products = await Product.find({ createdBy: userId })
      .populate({
        path: 'category',
        select: 'name',
      })
      .sort({ createdAt: -1 });

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "You have not created any products yet." });
    }

    res.status(200).json({ products });
  } catch (error) {
    console.error("Error fetching user's products:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getMyProducts };
