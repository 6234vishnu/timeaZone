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

const cartPage = async (req, res) => {
  try {
    if (req.session.user || req.session.googleId) {
      const id = req.session.user?._id || req.session.googleId;
      const userData = await User.findOne({ _id: id });

      const cart = await Cart.findOne({ userId: id })
        .populate("items.product")
        .exec();

      const product = await Product.findOne({ userId: id });
      const adress = (await Address.findOne({ userId: id })) || {};

      res.render("cartUserside", {
        user: userData,
        cart: cart || { items: [] },
        product: product,
        adress: adress,
      });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    res.status(500).send("server error");
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;

    const userId = req.session?.user || req.session.googleId;

    let cart = await Cart.findOne({ userId: userId });

    if (!cart) {
      cart = new Cart({
        userId: userId,
        items: [],
        totalAmount: 0,
      });
    }

    const productDetails = await Product.findById(productId);

    if (productDetails.quantity <= 0) {
      return res.status(404).json({ message: "Product is out of stock" });
    }

    if (!productDetails) {
      return res.status(404).json({ message: "Product not found" });
    }
    const productPrice = productDetails.salePrice;

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId.toString()
    );

    if (existingItem) {
      existingItem.quantity += 1;
      existingItem.price = productPrice;
    } else {
      cart.items.push({
        product: productId,
        quantity: 1,
        price: productPrice,
      });
    }

    cart.totalAmount = cart.items.reduce(
      (total, item) => total + item.quantity * item.price,
      0
    );

    await cart.save();

    res.status(200).json({ message: "Product added to cart successfully" });
  } catch (error) {
    console.error("Error in addToCart ", error);
    res
      .status(500)
      .json({ message: "Server error while adding product to cart" });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const itemId = req.params.id;
    let userId = null;

    if (req.session.user) {
      userId = req.session.user._id;
      req.session.user = req.session.user;
    } else if (req.session.googleId) {
      userId = req.session.googleId;
      req.session.googleId = req.session.googleId;
    } else {
      return res.redirect("/login");
    }

    const cartDetails = await Cart.findOne({ userId });

    if (!cartDetails) {
      return res.redirect("/cartPage");
    }

    if (!Array.isArray(cartDetails.items)) {
      cartDetails.items = [];
    }

    cartDetails.items = cartDetails.items.filter(
      (item) => item._id.toString() !== itemId
    );

    cartDetails.totalAmount = cartDetails.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    await cartDetails.save();

    return res.redirect("/cartPage");
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).send("Server error");
  }
};

const updateCartQnty = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;

    if (req.session.user || req.session.googleId) {
      const cartDetails = await Cart.findOne({
        userId: req.session.user?._id || req.session.googleId,
      });

      if (!cartDetails) {
        return res
          .status(400)
          .json({ success: false, message: "Cart not found" });
      }

      const cartItem = await Cart.findOne(
        {
          userId: req.session.user?._id || req.session.googleId,
          "items.product": itemId,
        },
        { "items.$": 1 }
      );

      if (!cartItem) {
        return res
          .status(400)
          .json({ success: false, message: "Item not found in cart" });
      }

      const productInCart = cartItem.items[0].product;

      if (!productInCart) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Product information is missing in cart item",
          });
      }

      const product = await Product.findById(productInCart);

      if (!product) {
        return res
          .status(400)
          .json({ success: false, message: "Product not found" });
      }

      // Check if the requested quantity is available in stock
      if (quantity > product.quantity) {
        return res
          .status(400)
          .json({ success: false, message: "Stocks unavailable" });
      }

      // Update the quantity of the product in the cart
      const updatedQuantity = await Cart.updateOne(
        {
          "items.product": product._id,
          userId: req.session.user?._id || req.session.googleId,
        },
        { $set: { "items.$.quantity": quantity } }
      );

      if (updatedQuantity.modifiedCount > 0) {
        // Recalculate the subtotal
        const updatedCart = await Cart.findOne({
          userId: req.session.user?._id || req.session.googleId,
        });
        const subtotal = updatedCart.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        // Update the totalAmount in the cart
        await Cart.updateOne(
          { userId: req.session.user?._id || req.session.googleId },
          { $set: { totalAmount: subtotal } }
        );

        return res.json({
          success: true,
          message: "Cart and product updated successfully",
          subtotal: subtotal,
        });
      }
    }

    return res.status(400).json({ success: false, message: "Cart not found" });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  cartPage,
  addToCart,
  removeFromCart,
  updateCartQnty,
};
