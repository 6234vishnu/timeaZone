const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    regularPrice: {
      type: Number,
      required: true,
    },
    salePrice: {
      type: Number,
      required: false,
    },
    createdOn: {
      type: Date,
      default: Date.now,
    },
    quantity: {
      type: Number,
      required: true,
    },
    size: {
      type: String,
      required: false,
    },
    color: {
      type: [String],
      required: true,
    },
    productImage: [
      {
        type: String,
        required: true,
      },
    ],
    status: {
      type: String,
      enum: ["Available", "Out of Stock", "Discontinued", "Few left"],
      default: "Available",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
