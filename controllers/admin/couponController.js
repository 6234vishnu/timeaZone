const { name } = require("ejs");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Coupon = require("../../models/couponSchema");

const couponRender = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    const coupon = await Coupon.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCoupons = await Coupon.countDocuments();
    const totalPages = Math.ceil(totalCoupons / limit);

    res.render("couponAdmin", {
      coupon: coupon,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    res.status(400).json("error to render coupon Page");
  }
};

const couponCreateRender = async (req, res) => {
  try {
    const product = await Product.find({ isBlocked: false });
    res.render("createCoupon", { product: product });
  } catch (error) {
    res.status(400).json("error to render create coupon Page");
  }
};

const couponCreate = async (req, res) => {
  try {
    const { code, discountValue, startDate, endDate, product } = req.body;

    if (discountValue <= 0) {
      return res.status(400).render("createCoupon", {
        message: "Discount value must be between 0 and 10,000.",
      });
    }

    const existingCoupon = await Coupon.findOne({ code: code });
    if (existingCoupon) {
      return res
        .status(400)
        .render("createCoupon", {
          message: "Coupon with this code already exists",
        });
    }

    const selectedProduct = await Product.findOne({ name: product });
    if (!selectedProduct) {
      return res
        .status(400)
        .render("createCoupon", { message: "product not found" });
    }

    const newCoupon = new Coupon({
      code: code,
      discountValue: discountValue,
      product: selectedProduct._id,
      startDate: startDate,
      endDate: endDate,
    });
    let saved = await newCoupon.save();
    if (!saved) {
      res.status(400).send("error in adding coupon");
    }
    const coupons = await Coupon.find({});
    return res.redirect("/admin/coupon");
  } catch (error) {
    res.status(400).json("error to create coupon ");
  }
};

const blockCoupon = async (req, res) => {
  try {
    const id = req.query.id;
    await Coupon.updateOne({ _id: id }, { $set: { isActive: false } });
    res.redirect("/admin/coupon");
  } catch (error) {
    res.status(500).render("pageNotfoundServer");
  }
};
const unBlockCoupon = async (req, res) => {
  try {
    const id = req.query.id;
    await Coupon.updateOne({ _id: id }, { $set: { isActive: true } });
    res.redirect("/admin/coupon");
  } catch (error) {
    res.status(500).render("pageNotfoundServer");
  }
};

const searchCoupon = async (req, res) => {
  try {
    const searchQuery = req.query.searchQuery;
    const coupons = await Coupon.find({ _id: searchQuery });
    res.render("couponAdmin", { coupon: coupons });
  } catch (error) {
    res.status(500).render("pageNotfoundServer");
  }
};

module.exports = {
  couponRender,
  couponCreate,
  couponCreateRender,
  unBlockCoupon,
  blockCoupon,
  searchCoupon,
};
