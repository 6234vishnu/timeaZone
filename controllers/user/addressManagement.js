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

const savedAdress = async (req, res) => {
  try {
    const userId = req.session.user?._id || req.session.googleId;

    if (!userId) {
      return res.redirect("/login", {
        message: "Please log in to view addresses.",
      });
    }
    const findUser = await User.findOne({
      _id: userId,
      isBlocked: false,
    }).populate("address");

    if (findUser) {
      const address = await Address.find({ userId: findUser._id });

      req.session.user = findUser;

      res.render("savedAdresses", {
        address: findUser.address,
        user: findUser,
      });
    } else {
      res.render("login", { message: "User not found or blocked." });
    }
  } catch (error) {
    res.render("pageNotFoundServer");
    console.error("Error in savedAdresses:", error);
  }
};

const editSavedAd = async (req, res) => {
  try {
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

    const addressId = req.query.id;

    const user = req.session?.user?._id || req.session.googleId;

    const findUser = await User.findOne({ _id: user, isBlocked: false });

    if (findUser) {
      const addressExists = findUser.address.some((addr) =>
        addr.equals(addressId)
      );

      if (!addressExists) {
        console.error("Address does not belong to this user.");
        res.redirect("/savedAdresses");
        return;
      }

      const updated = await Address.findByIdAndUpdate(
        addressId,
        {
          $set: {
            "adress.name": name,
            "adress.phone": phoneNumber,
            "adress.city": city,
            "adress.state": state,
            "adress.district": district,
            "adress.pincode": pincode,
            "adress.building": building,
            "adress.area": area,
          },
        },
        { new: true } // Ensure it returns the updated document
      );

      if (updated) {
        const updatedAddress = await Address.findOne({ userId: findUser._id });
        res.redirect("/savedAdresses");
      } else {
        res.redirect("/savedAdresses");
      }
    } else {
      res.send("User not found");
    }
  } catch (error) {
    res.render("pageNotFoundServer");
    console.error("Error in editSavedAd ", error);
  }
};

const deleteAdress = async (req, res) => {
  try {
    const addressId = req.query.id;

    if (!addressId) {
      return res.status(400).send("Address ID is missing");
    }

    const deleted = await Address.deleteOne({ _id: addressId });

    if (deleted.deletedCount > 0) {
      const id = req.session.user._id;
      const address = Address.find({ userId: id });
      req.session.message = "Address deleted successfully";
      return res.redirect("/savedAdresses");
    } else {
      return res.status(404).send("Address not found");
    }
  } catch (error) {
    console.error("Error deleteAddress:", error);
    return res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  savedAdress,
  editSavedAd,
  deleteAdress,
};
