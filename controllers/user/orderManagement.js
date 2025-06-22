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
const Wallet = require("../../models/walletSchema");
const Coupon = require("../../models/couponSchema");
const Offer = require("../../models/offerSchema");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const dotenv = require("dotenv");

dotenv.config();

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

const checkout = async (req, res) => {
  try {
    let offerIds = [req.body.offerIds];
    let outofstock = null;

    if (req.session.user || req.session.googleId) {
      const items = req.body.items ? Object.values(req.body.items) : [];

      if (!items || items.length === 0) {
        return res.status(400).json({ message: "No items in the order." });
      }

      let userId = req.session.user;
      let googleUserId = req.session.googleId;
      let userData = null;
      let googleUserData = null;

      if (userId) {
        userData = await User.findOne({ _id: userId }).populate("address");
      }
      if (googleUserId) {
        googleUserData = await User.findOne({ _id: googleUserId }).populate(
          "address"
        );
      }

      const populatedItems = await Promise.all(
        items.map(async (item) => {
          const productDetails = await Product.findById(
            item.productId
          ).populate("category");

          if (!productDetails) {
            throw new Error(`Product with ID ${item.productId} not found`);
          }

          if (productDetails.quantity < item.quantity) {
            outofstock = "product out of stock";
          }

          return {
            product: productDetails,
            quantity: item.quantity,
            salePrice: productDetails.salePrice,
          };
        })
      );
      let offer = null;
      let offerDiscount = null;
      for (let i = 0; i < offerIds.length; i++) {
        offer = await Offer.findOne({ _id: offerIds[i] });
        if (offer) {
          if (offer.discountValue > 0) {
            offerDiscount = offer.discountValue;
          }
        }
      }

      const totalAmount = populatedItems.reduce(
        (total, item) => total + item.salePrice * item.quantity,
        0
      );

      deliveryCharges = 10;
      const finalTotal = deliveryCharges + totalAmount - offerDiscount;

      const coupons = await Coupon.findOne({
        discountValue: { $lte: totalAmount },
      });

      const allAddresses = userData?.address || googleUserData?.address || [];
      const uniqueAddresses = allAddresses.filter(
        (address, index, self) =>
          index ===
          self.findIndex((a) => a._id.toString() === address._id.toString())
      );
      const prId = items.map((item) => item.productId);

      const offersExisting = await Offer.find({ product: prId });

      res.render("checkOut", {
        user: userData || googleUserData,
        addresses: uniqueAddresses,
        items: populatedItems,
        totalAmount,
        coupon: coupons,
        finalTotal,
        outofstock,
        deliveryCharges,
        offer: offersExisting,
      });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.error("Error in checkout:", error);
    res.status(500).send("Server error.");
  }
};

const applyCoupon = async (req, res) => {
  const { couponCode } = req.body;

  // Query your coupon database to get the discount value
  Coupon.findOne({ code: couponCode })
    .then((coupon) => {
      if (!coupon || new Date() > coupon.expiryDate) {
        return res.json({
          success: false,
          message: "Invalid or expired coupon.",
        });
      }

      res.json({ success: true, discountValue: coupon.discountValue });
    })
    .catch((err) => {
      console.error("Error fetching coupon:", err);
      res.json({ success: false, message: "An error occurred." });
    });
};

const addAdressOrderpge = async (req, res) => {
  try {
    const maxAdress = 3;

    const userId = req.session.userId;

    const {
      name,
      phoneNumber,
      city,
      state,
      district,
      pincode,
      area,
      building,
    } = req.body;

    const user = await User.findOne({ _id: userId, isBlocked: false });

    if (!user) {
      return res.status(404).json({ message: "User not found or blocked" });
    }

    const newAddress = {
      adressType: "home",
      name: name,
      city: city,
      district: district,
      phone: phoneNumber,
      pincode: pincode,
      state: state,
      area: area,
      building: building,
    };

    let userAddress = await Address.findOne({ userId: userId });

    userAddress = new Address({
      userId: userId,
      adress: newAddress,
    });

    await userAddress.save();

    res.redirect("/orderPage");
  } catch (error) {
    console.error("Error addAdressOrderpge:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const orderProduct = async (req, res) => {
  try {
    if (req.session.user || req.session.googleId) {
      let { productId, address, paymentType, quantity, subtotal, couponCode } =
        req.body;

      if (!productId || !address || !paymentType || !quantity || !subtotal) {
        return res
          .status(400)
          .json({ message: "All required fields must be filled." });
      }

      const userForOrder = req.session.user
        ? req.session.user._id
        : req.session.googleId;

      const orderAddress = await Address.findById(address);

      if (!orderAddress) {
        return res.status(404).json({ message: "Address not found." });
      }

      const productsForOrder = [];

      for (let i = 0; i < productId.length; i++) {
        const product = await Product.findOne({ _id: productId[i] });
        if (!product || product.quantity <= 0) {
          return res.status(404).json({
            message: `Product not found or it is out of stock ${productId[i]},`,
          });
        }

        const qty = parseInt(quantity[i], 10);
        if (isNaN(qty) || qty < 1) {
          return res.status(400).json({ message: "Invalid product quantity." });
        }

        productsForOrder.push({
          product: product._id,
          quantity: qty,
          price: Number(product.salePrice),
        });

        await Product.findByIdAndUpdate(
          product._id,
          { $inc: { quantity: -qty } },
          { new: true }
        );
      }

      let couponDiscount = 0;
      let couponCodeApplied = null;
      let coupon = null;
      if (couponCode) {
        coupon = await Coupon.findOne({ code: couponCode });

        if (coupon) {
          couponDiscount = coupon.discountValue;
          couponCodeApplied = coupon.code;
        } else {
        }
      }

      const tAmount = subtotal;

      let cp = null;

      let walletBalence = await Wallet.findOne({ user: userForOrder });

      if (paymentType === "Wallet" || walletBalence >= tAmount) {
        const newOrder = new Order({
          user: userForOrder,
          address: orderAddress._id,
          couponCode: cp?.coupon.code,
          discount: couponDiscount || 0,
          products: productsForOrder,
          totalAmount: Number(tAmount),
          paymentStatus: "Completed",
          orderStatus: "Processing",
          paymentMethod: paymentType,
        });

        await newOrder.save();
        req.session.order = newOrder;

        const balanceUpdate = await Wallet.updateOne(
          { user: userForOrder },
          {
            $inc: { balance: -tAmount },
            $push: {
              transactions: {
                type: "debit",
                amount: tAmount,
                date: new Date(),
              },
              orders: newOrder._id,
            },
          }
        );

        return res.redirect("/orderConfirmation");
      }

      const newOrder = new Order({
        user: userForOrder,
        address: orderAddress._id,
        couponCode: cp?.couponCode,
        discount: couponDiscount || 0,
        products: productsForOrder,
        totalAmount: Number(tAmount),
        paymentStatus: "Pending",
        orderStatus: "Processing",
        paymentMethod: paymentType,
      });

      await newOrder.save();
      req.session.order = newOrder;

      res.redirect("/orderConfirmation");
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.error("Error in orderProduct:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const razorpayOrder = async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required." });
    }

    let amountInINR = parseFloat(amount) * 100;
    if (isNaN(amountInINR) || amountInINR <= 0) {
      return res.status(400).json({ error: "Invalid amount provided." });
    }

    function convertUSDtoINR(amount, exchangeRate) {
      return amount * exchangeRate;
    }

    const exchangeRate = 83.5;

    amountInINR = convertUSDtoINR(amount, exchangeRate);

    const options = {
      amount: Math.round(amountInINR),
      currency: currency || "INR",
      receipt: receipt || "receipt_order_" + new Date().getTime(),
      payment_capture: 1,
    };

    const order = await razorpayInstance.orders.create(options);

    res.json(order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: error });
  }
};

const paymentVerify = async (req, res) => {
  const { payment, order, userId, address, coupon, products } = req.body;

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    payment;

  const secret = process.env.RAZORPAY_KEY_SECRET;

  const sanitizedCoupon = coupon.trim().replace(/['"]/g, "");

  const couponDetails = await Coupon.findOne({ code: sanitizedCoupon });

  if (couponDetails) {
  } else {
  }

  let productsForOrder = [];

  productsForOrder = products;

  const generated_signature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  let exchangeRate = 83.5;

  if (generated_signature === razorpay_signature) {
    try {
      const newOrder = new Order({
        user: userId,
        address: address,
        paymentMethod: "UPI",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        discount:
          couponDetails && couponDetails.discountValue
            ? couponDetails.discountValue
            : 0,
        couponCode: sanitizedCoupon,
        totalAmount: Math.floor(order.amount / exchangeRate),
        paymentStatus: "Completed",
        products: productsForOrder,
      });

      await newOrder.save();

      req.session.order = newOrder;

      res.json({ success: true, order: newOrder });
    } catch (error) {
      console.error("Error saving order:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to save order." });
    }
  } else {
    console.error("Invalid Razorpay signature.");
    res
      .status(400)
      .json({ success: false, message: "Payment verification failed." });
  }
};

const orderConform = async (req, res) => {
  try {
    if (req.session.order) {
      res.render("orderConfirmation");
    }
  } catch (error) {
    console.error("Error in orderconfirm:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const orderDetails = async (req, res) => {
  try {
    if (req.session.user || req.session.googleId) {
      const orderdetails = req.session.order._id;

      const order = await Order.findOne({ _id: orderdetails })
        .populate("products.product")
        .populate("address");

      const user = await User.findOne({ _id: order.user });
      const adress = await Address.findOne({ _id: req.session.order.address });

      const productIds = order.products.map((item) => item.product);
      const products = await Product.find({ _id: { $in: productIds } });

      res.render("orderdetails", {
        order: order,
        product: products,
        adress: adress,
        user: user,
      });
      req.session.order = order;
    }
  } catch (error) {
    console.error("Error in orderDetails:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const cancelOrder = async (req, res) => {
  try {
    if (req.session.order) {
      const order = req.session.order;
      const cancelOrder = await Order.updateOne(
        { _id: order._id },
        { $set: { orderStatus: "Cancelled" } }
      );

      let orderDetails = await Order.findOne({ _id: order._id })
        .populate("products.product")
        .populate("user");

      // Restore product quantities
      for (let orderProduct of orderDetails.products) {
        const productId = orderProduct.product._id;
        const newQuantity = orderProduct.quantity;

        await Product.findByIdAndUpdate(
          productId,
          { $inc: { quantity: +newQuantity } },
          { new: true }
        );
      }

      let wallet = await Wallet.findOne({ user: orderDetails.user._id });

      // If wallet does not exist, create one

      if (!wallet) {
        wallet = new Wallet({
          user: orderDetails.user._id,
          balance: orderDetails.totalAmount,
          transactions: [
            {
              type: "credit",
              amount: orderDetails.totalAmount,
              date: new Date(),

              reason: "Order Cancellation",
            },
          ],
          orders: order._id,
        });
        await wallet.save();
      } else {
        const balanceUpdate = await Wallet.updateOne(
          { user: orderDetails.user },
          {
            $inc: { balance: +orderDetails.totalAmount },
            $push: {
              transactions: {
                type: "credit",
                amount: orderDetails.totalAmount,
                date: new Date(),

                reason: "Order Cancellation",
              },
              orders: order._id,
            },
          }
        );
      }
      if (cancelOrder) {
        res.render("orderCancel");
      }
    }
  } catch (error) {
    console.error("Error in cancelOrder:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const orderHistory = async (req, res) => {
  try {
    if (req.session.user || req.session.googleId) {
      let userId;

      if (req.session.user) {
        userId = req.session.user._id;
      } else if (req.session.googleId) {
        userId = req.session.googleId;
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const skip = (page - 1) * limit;
      const totalOrders = await Order.countDocuments({ user: userId });

      const orderss = await Order.find({ user: userId })
        .populate("products.product")
        .skip(skip)
        .limit(limit);

      let orders = orderss.reverse();

      if (!orders || orders.length === 0) {
        return res.render("orderhistory", { order: null, products: [] });
      }

      const validProducts = orders
        .flatMap((order) => order.products)
        .filter((item) => item.product !== null);

      if (validProducts.length === 0) {
        return res.render("orderhistory", { order: orders, products: [] });
      }

      const productIds = validProducts.map((item) => item.product._id);
      const productDetails = await Product.find({ _id: { $in: productIds } });
      const totalPages = Math.ceil(totalOrders / limit);

      return res.render("orderhistory", {
        order: orders,
        products: productDetails,
        currentPage: page,
        totalPages: totalPages,
      });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.error("Error in orderHistory:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const orderStatusPage = async (req, res) => {
  try {
    let userId;

    if (req.session.user) {
      userId = req.session.user._id;
    } else if (req.session.googleId) {
      userId = req.session.googleId;
    } else {
      return res.redirect("/login");
    }

    const orderId = req.params.id;

    const order = await Order.findOne({ _id: orderId })
      .populate("products.product")
      .populate("address")
      .exec();

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const user = await User.findOne({ _id: userId }).populate("address");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.render("orderstatus", {
      order: order,
      user: user,
    });
  } catch (error) {
    console.error("Error in orderstatus:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const ratingSubmit = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { userId, rating, review } = req.body;

    const newReview = new Review({
      user: userId,
      order: orderId,

      rating: rating,
      review: review,
    });

    await newReview.save();

    await Order.findByIdAndUpdate(
      orderId,
      { $push: { reviews: newReview._id } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Review submitted successfully!",
      review: newReview,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while submitting the review.",
    });
  }
};

const returnOrder = async (req, res) => {
  try {
    if (req.session.user || req.session.googleId) {
      const id = req.params.id;
      const { reason } = req.body;

      const result = await Order.updateOne(
        { _id: id },
        {
          $set: {
            orderStatus: "Returned",
          },
        }
      );

      if (result.modifiedCount === 0) {
        return res
          .status(404)
          .json({ message: "Order not found or already returned." });
      }

      const orderList = await Order.findOne({ _id: id })
        .populate("products.product")
        .populate("address")
        .exec();

      if (!orderList) {
        return res.status(404).json({ message: "Order not found." });
      }

      const user = await User.findOne({
        $or: [
          { _id: req.session.user ? req.session.user._id : null },
          { _id: req.session.googleId },
        ],
      }).exec();

      for (let orderProduct of orderList.products) {
        const productId = orderProduct.product._id;
        const newQuantity = orderProduct.quantity;

        const updateProduct = await Product.findByIdAndUpdate(
          productId,
          { $inc: { quantity: +newQuantity } },
          { new: true }
        );
      }

      res.render("orderstatus", { order: orderList, user: user });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.error("Error in returnOrder:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const cancelTheOrder = async (req, res) => {
  try {
    const orderId = req.params.Id;
    const { reason } = req.body;

    const result = await Order.updateOne(
      { _id: orderId },
      {
        $set: { orderStatus: "Cancelled" },
      }
    );

    const orderData = await Order.findOne({ _id: orderId }).populate("user");

    if (!orderData) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    let wallet = await Wallet.findOne({ user: orderData.user._id });

    if (!wallet) {
      wallet = new Wallet({
        user: orderData.user._id,
        balance: orderData.totalAmount,
        transactions: [
          {
            type: "credit",
            amount: orderData.totalAmount,
            date: new Date(),
            order: orderId,
            reason: reason || "Order Cancellation",
          },
        ],
      });
      await wallet.save();
    }

    const walletUpdate = await Wallet.updateOne(
      { user: orderData.user._id },
      {
        $inc: { balance: +orderData.totalAmount },
        $push: {
          transactions: {
            type: "credit",
            amount: orderData.totalAmount,
            date: new Date(),
            order: orderId,
            reason: reason || "Order Cancellation",
          },
        },
      }
    );

    if (result.modifiedCount === 0 || walletUpdate.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found or already cancelled.",
      });
    }

    // Populate the order list
    const orderList = await Order.findOne({ _id: orderId })
      .populate("products.product")
      .populate("address")
      .exec();

    if (!orderList) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const user = await User.findOne({
      $or: [{ _id: req.session.user?._id }, { _id: req.session.googleId }],
    });

    for (let orderProduct of orderList.products) {
      const productId = orderProduct.product._id;
      const newQuantity = orderProduct.quantity;

      await Product.findByIdAndUpdate(
        productId,
        { $inc: { quantity: +newQuantity } },
        { new: true }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled and refund processed successfully.",
      order: orderList,
      user: user,
    });
  } catch (error) {
    console.error("Error in cancelTheOrder:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

const filterOrders = async (req, res) => {
  try {
    const { orderStatus, searchOrder } = req.body;

    const userId = req.session?.user?._id || req.session.googleId;

    let query = { user: userId };
    if (orderStatus) {
      const ordersByStatus = await Order.find({
        user: userId,
        orderStatus: orderStatus,
      });
      const orderIds = ordersByStatus.map((order) => order._id);
      query._id = { $in: orderIds };
    }

    // if (searchOrder) {
    //   const orders = await Order.find({ _id: { $regex: searchOrder, $options: "i" } });
    //   // const orders = await Order.find({ $regex:{name:orderStatus} });
    //   const productIds = orders.map(order => order._id)
    //   query.products = { $elemMatch: { product: { $in: productIds } } };
    // }

    const orders = await Order.find(query).populate("products.product").exec();

    res.json({ success: true, orders });
  } catch (error) {
    console.error("Error filtering orders:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

module.exports = {
  addAdressOrderpge,
  // orderHistoryRender,
  orderProduct,
  orderConform,
  orderDetails,
  cancelOrder,
  orderHistory,
  orderStatusPage,
  ratingSubmit,
  returnOrder,
  cancelTheOrder,
  filterOrders,
  checkout,
  razorpayOrder,
  paymentVerify,
  applyCoupon,
};
