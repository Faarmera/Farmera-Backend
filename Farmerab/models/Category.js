const mongoose = require("mongoose");

const categorySchema = mongoose.Schema(
  {
    name: { 
      type: String,
      required: true,
    },
    Product: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
      },
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;