const User = require("../../models/userSchema");
const nodeMailer = require("nodemailer");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const Category = require("../../models/categorySchema");
const Address = require("../../models/adressSchema");
const Cart = require("../../models/cartSchema");
const Order = require("../../models/orderSchema");
const Review = require("../../models/reviewSchema");
const Wishlist = require("../../models/whislistSchema");

const wishlistPage = async (req, res) => {
  try {
    if (req.session.user || req.session.googleId) {
      const wishlist = await Wishlist.find({
        user: req.session?.user?._id || req.session.googleId,
      }).populate("products");

      return res.render("wishlist", { wishlist: wishlist });
    }
    return res.redirect("/login");
  } catch (error) {
    console.error("Error in wishlist ", error);
    res
      .status(500)
      .json({ message: "Server error while adding product to wishlist" });
  }
};

const wishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    let userId = req.session?.user?._id || req.session.googleId;

    if (!userId) {
      return res.status(401).json({ message: "User is not authenticated" });
    }

    if (!req.session.user) {
      req.session.user = { _id: userId };
    }

    let wishlist = await Wishlist.findOne({ user: userId }).populate(
      "products"
    );

    if (!wishlist) {
      wishlist = new Wishlist({
        user: userId,
        products: [],
      });
    } else {
      const productExists = wishlist.products.find(
        (item) => item._id.toString() === productId.toString()
      );
      if (productExists) {
        return res
          .status(404)
          .json({ message: "Product already exists in wishlist" });
      }
    }

    const productDetails = await Product.findById(productId);

    if (!productDetails) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (productDetails.quantity <= 0) {
      return res.status(404).json({ message: "Product is out of stock" });
    }

    wishlist.products.push(productId);
    await wishlist.save();

    res.status(200).json({
      message: "Product added to wishlist successfully",
    });
  } catch (error) {
    console.error("Error in wishlist", error);
    res
      .status(500)
      .json({ message: "Server error while adding product to wishlist" });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    let userId;
    if (req.session.user) {
      userId = req.session.user._id;
    } else if (req.session.googleId) {
      userId = req.session.googleId;
    } else {
      return res.status(401).json({ message: "User is not authenticated" });
    }

    const wishlist = await Wishlist.findOne({ user: userId }).populate(
      "products"
    );

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    const { productId } = req.body;

    const productIndex = wishlist.products.findIndex(
      (item) => item._id.toString() === productId.toString()
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in wishlist" });
    }

    wishlist.products.splice(productIndex, 1);

    await wishlist.save();

    res
      .status(200)
      .json({ message: "Product removed from wishlist successfully" });
  } catch (error) {
    console.error("Error in removeFromWishlist", error);
    res
      .status(500)
      .json({ message: "Server error while removing product from wishlist" });
  }
};

module.exports = {
  wishlistPage,
  wishlist,
  removeFromWishlist,
};
