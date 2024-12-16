const Product = require("../models/Product.js");
const Category = require("../models/Category.js")
const Cloudinary = require("../config/cloudinary.js");
const fs = require("fs");

const getAllProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, location } = req.query;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) {
        filter.price.$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        filter.price.$lte = parseFloat(maxPrice);
      }
    }

    if (location) {
      filter.location = location;
    }

    const products = await Product.find(filter);

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: "Product not found" });
  }
};

// const createProduct = async (req, res) => {
//   try {
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ error: "At least one image is required" });
//     }

//     const { name, store, qtyAvailable, category, price, location, description } = req.body;

//     const images = [];
//     const imageIds = [];

//     for (const file of req.files) {
//       console.log("Processing file:", file.originalname, "Path:", file.path);
//       if (!file.path) {
//         return res.status(400).json({ error: "Invalid file or missing file path." });
//       }

//       const result = await Cloudinary.uploader.upload(file.path, {
//         folder: "products",
//       });

//       console.log("Uploaded file to Cloudinary:", result.secure_url);

//       images.push(result.secure_url);
//       imageIds.push(result.public_id);

//       if (fs.existsSync(file.path)) {
//         fs.unlinkSync(file.path);
//       }
//     }

//     const newProduct = new Product({
//       name,
//       store,
//       qtyAvailable,
//       category,
//       price,
//       location,
//       description,
//       images,
//       imageIds,
//     });

//     await newProduct.save();

//     res.status(201).json({ message: "Product created successfully", product: newProduct });
//   } catch (error) {
//     console.error("Error creatingProduct controller:", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

const createProduct = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "At least one image is required" });
    }

    const { name, store, qtyAvailable, category, price, location, description } = req.body;
    if (!name || !store || !category || !price || !qtyAvailable || !location) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (price <= 0 || qtyAvailable < 0) {
      return res.status(400).json({ error: "Invalid price or quantity available" });
    }

    const existingCategory = await Category.findById(category);
    if (!existingCategory) {
      return res.status(404).json({ error: "Category not found" });
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
      store,
      qtyAvailable,
      category,
      price,
      location,
      description,
      images,
      imageIds,
    });
    await newProduct.save();

    res.status(201).json({ message: "Product created successfully", product: newProduct });
  } catch (error) {
    console.error("Error creatingProduct controller:", error.message);
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
    if (category) product.category = category;
    if (price) product.price = price;
    if (location) product.location = location;
    if (description) product.description = description;

    await product.save();

    res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error("Error updatinProduct:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

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

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct};
