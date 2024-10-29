const User = require("../../models/userSchema");
const nodeMailer = require("nodemailer");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const Category = require("../../models/categorySchema");
const Address = require("../../models/adressSchema");
const Cart = require("../../models/cartSchema");
const Order=require("../../models/orderSchema")
const Review=require("../../models/reviewSchema")

const pageNotfoundClient = async (req, res) => {
    res.render("pageNotfoundClient");
  };
  const pageNotfoundServer = async (req, res) => {
    res.render("pageNotfoundServer");
  };
  const loadForgot = (req, res) => {
    try {
      return res.render("forgotPassword");
    } catch (error) {
      if (error) {
        console.log("error in render forgotPassword");
      }
    }
  };
  const loadEnterOtp = (req, res) => {
    try {
      return res.render("verifyOtpForgot");
    } catch (error) {
      if (error) {
        console.log("error in render forgotPassword");
      }
    }
  };
  const forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
  
      const findUser = await User.findOne({ email: email });
  
      if (findUser) {
        const otpGenerated = await generateOtp();
        console.log(otpGenerated);
        req.session.otpGenerated = otpGenerated;
        req.session.email = email;
        return res.render("verifyOtpForgot");
      } else {
        return res.render("forgotPassword", {
          message: "user not found in this email",
        });
      }
    } catch (error) {
      if (error) {
        res.status(400).send({ message: "account not exists" });
        console.log("error in foregot password");
      }
    }
  };

  const newPasswordrender = (req, res) => {
    try {
      return res.render("newPassword");
    } catch (error) {
      res.status(500).redirect("/pageNotfoundServer");
      console.log("error in foregot password");
    }
  };
  
  const otpcompareforgot = async (req, res) => {
    try {
      const { otp } = req.body;
      const generatedOtp = req.session.otpGenerated;
      console.log(otp, generatedOtp);
  
      if (otp === generatedOtp) {
        return res
          .status(200)
          .json({ success: true, redirectUrl: "/newPassword" });
      } else {
        return res.status(400).json({ message: "otp is not matched" });
      }
    } catch (error) {
      console.log("error in comparison", error);
    }
  };
  
  const newPassword = async (req, res) => {
    try {
      const { newPassword, confirmPassword } = req.body;
      const email = req.session.email;
      if (newPassword === confirmPassword) {
        await User.updateOne(
          { email: email },
          { $set: { password: newPassword } }
        );
        return res.status(200).redirect("/login");
      }
      return res.status(400).json({ message: "passwords are is not match" });
    } catch (error) {
      console.log("password not matched error", error);
    }
  };

  module.exports={
pageNotfoundClient,
  pageNotfoundServer,
  loadForgot,
  forgotPassword,
  loadEnterOtp,
  newPasswordrender,
  otpcompareforgot,
  newPassword,
  }