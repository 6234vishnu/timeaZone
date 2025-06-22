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
const Coupon = require("../../models/couponSchema");
const Offer = require("../../models/offerSchema");

const loadProduct = async (req, res) => {
  try {
    const id = req.query.id;
    if (req.session.id || req.session.googleId) {
      const product = await Product.findOne({ _id: id, isBlocked: false })
        .populate("brand")
        .populate("category");

      if (!product) {
        return res.redirect("/pageNotFoundServer");
      }

      const brand = await Brand.findOne({
        _id: product.brand._id,
        isBlocked: false,
      });
      const category = await Category.findOne({
        _id: product.category._id,
        isBlocked: false,
      });

      const similarProducts = await Product.find({
        category: product.category._id,
        _id: { $ne: product._id },
        isBlocked: false,
      })
        .limit(4)
        .populate("category")
        .populate("brand")
        .exec();
      let userData = null;
      if (req.session.user) {
        userData = await User.findOne({
          _id: req.session.user,
          isBlocked: false,
        });
        if (userData) {
          req.session.user = userData;
        }
      }
      if (req.session.googleId) {
        userData = await User.findOne({
          _id: req.session.googleId,
          isBlocked: false,
        });
        if (userData) {
          req.session.googleId = userData._id;
        }
      }

      const review = await Review.find({}).populate("user").exec();
      const coupons = await Coupon.find({
        applicableCategories: product.category.name,
      });

      const offer = await Offer.find({ isActive: true, product: product._id });

      res.render("productsPage", {
        user: userData,
        product: product,
        brand: brand,
        category: category,
        similarProducts: similarProducts,
        review: review,
        coupon: coupons,
        offer: offer,
      });
    } else {
      const product = await Product.findOne({ _id: id, isBlocked: false })
        .populate("brand")
        .populate("category");

      if (!product) {
        return res.redirect("/pageNotFoundServer");
      }

      const brand = await Brand.findOne({
        _id: product.brand._id,
        isBlocked: false,
      });
      const category = await Category.findOne({
        _id: product.category._id,
        isBlocked: false,
      });

      const similarProducts = await Product.find({
        category: product.category._id,
        _id: { $ne: product._id },
        isBlocked: false,
      })
        .limit(4)
        .populate("category")
        .populate("brand")
        .exec();

      res.render("productsPage", {
        user: userData,
        product: product,
        brand: brand,
        category: category,
        similarProducts: similarProducts,
      });
    }
  } catch (error) {
    res.redirect("/pageNotFoundServer");
  }
};

const shopPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;

    const skip = (page - 1) * limit;
    const total = await Product.countDocuments();
    const product = await Product.find({ isBlocked: false })
      .skip(skip)
      .limit(limit);
    const totalPages = Math.ceil(total / limit);

    const category = await Category.find({ isBlocked: false });
    const brand = await Brand.find({ isBlocked: false });

    let userData = null;
    if (req.session.user) {
      userData = await User.findOne({
        _id: req.session.user._id,
        isBlocked: false,
      });
      if (userData) {
        req.session.user = userData;
      }
    }
    if (req.session.googleId && !userData) {
      userData = await User.findOne({
        _id: req.session.googleId,
        isBlocked: false,
      });
      if (userData) {
        req.session.googleId = userData._id;
      }
    }

    res.render("shop", {
      user: userData,
      product,
      category,
      brand,
      currentPage: page,
      totalPages,
      limit,
    });
  } catch (error) {
    return res.status(500).send("Server error");
  }
};

const filterProducts = async (req, res) => {
  try {
    const {
      brand,
      category,
      priceRange,
      sortBy,
      page = 1,
      limit = 9,
    } = req.query;

    const query = { isBlocked: false, quantity: { $gt: 0 } };

    if (brand) {
      const brandDoc = await Brand.findOne({ name: brand.trim() });

      if (brandDoc) {
        query.brand = brandDoc._id;
      }
    }

    if (category) {
      const newCategory = category.trim();
      const categoryDoc = await Category.findOne({ name: newCategory });

      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }

    if (priceRange) {
      let minPrice = 0;
      let maxPrice = Number.MAX_VALUE;

      if (priceRange.includes("-")) {
        const [min, max] = priceRange.split("-").map((part) => part.trim());
        minPrice = parseFloat(min) || 0;
        maxPrice = parseFloat(max) || Number.MAX_VALUE;
      } else if (priceRange.startsWith(">=")) {
        minPrice = parseFloat(priceRange.slice(2)) || 0;
      } else if (priceRange.startsWith(">")) {
        minPrice = parseFloat(priceRange.slice(1)) + 1 || 0;
      } else if (priceRange.startsWith("<=")) {
        maxPrice = parseFloat(priceRange.slice(2)) || Number.MAX_VALUE;
      } else if (priceRange.startsWith("<")) {
        maxPrice = parseFloat(priceRange.slice(1)) - 1 || Number.MAX_VALUE;
      }

      if (!isNaN(minPrice) && !isNaN(maxPrice)) {
        query.salePrice = { $gte: minPrice, $lte: maxPrice };
      } else {
        console.warn("Invalid price range provided:", priceRange);
      }
    }

    let sort = {};
    if (sortBy) {
      switch (sortBy) {
        case "priceLowToHigh":
          sort.salePrice = 1;
          break;
        case "priceHighToLow":
          sort.salePrice = -1;
          break;
        case "nameAtoZ":
          sort.name = 1;
          break;
        case "nameZtoA":
          sort.name = -1;
          break;
        case "rating":
          sort.averageRating = -1;
          break;
        case "newArrivals":
          sort.createdAt = -1;
          break;
        default:
          sort.createdAt = -1;
          break;
      }
    }

    const skip = (page - 1) * limit;
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const allBrands = await Brand.find();
    const allCategories = await Category.find();

    res.render("shop", {
      product: products,
      brand: allBrands,
      category: allCategories,
      currentPage: parseInt(page),
      totalPages,
      limit,
      selectedBrand: brand || "",
      selectedCategory: category || "",
      selectedPriceRange: priceRange || "",
      selectedSortBy: sortBy || "",
    });
  } catch (err) {
    console.error("Error in filterProducts:", err);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  loadProduct,
  shopPage,
  filterProducts,
};
