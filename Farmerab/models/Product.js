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
      required: true 
    },
    qtyAvailable: { 
      type: Number, 
      required: true 
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
  },
  { timestamps: true }
);
productSchema.plugin(mongoosePaginate);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
