const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const productSchema = mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true 
    },
    store: { 
      type: String, 
      required: true,
      maxLength: 200
    },
    qtyAvailable: { 
      type: Number, 
      required: true, 
      default: 0,
      validate: {
        validator: Number.isFinite,
        message: "qtyAvailable must be a valid number.",
      }
    },
    category: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true 
    },
    price: { 
      type: Number, 
      required: true 
    },
    location: {
      type: String,
      required: true,
    },
    description: { 
      type: String, 
      required: true 
    },
    images: [{ 
      type: String,
      required: true 
    }],
    imageIds: [{ 
      type: String,
      required: true 
    }],
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      // required: true 
    },
  },
  { timestamps: true }
);
productSchema.plugin(mongoosePaginate);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
