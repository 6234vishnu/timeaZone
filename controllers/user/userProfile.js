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


const userProfile = async (req, res) => {
    try {
      const googleUser = req.session.googleId;
  
      const user = req.session.user;
  
      if (user) {
        const userData = await User.findOne({ _id: user, isBlocked: false });
     
        req.session.user = userData;
      
        return res.render("userProfile", { user: userData });
      } else if (googleUser) {
        const googleUserData = await User.findOne({
          _id: googleUser,
          isBlocked: false,
        });
        return res.render("userProfile", { user: googleUserData });
      } else {
        return res.render("login");
      }
    } catch (error) {
      console.log("error in showing userprofile", error);
      res.status(500).json({
        message: "an error occured cant show user profile",
      });
    }
  };
  
  const updateProfile = async (req, res) => {
    try {
      const id = req.session.user._id;
      const { name, phoneNumber, email } = req.body;
  
      // Find the user
      const user = await User.findOne({ _id: id });
  
      if (user) {
        await User.updateOne(
          { _id: id },
          { name: name, phoneNumber: phoneNumber, email: email }
        );
            req.session.user=user
        return res.redirect("/userProfile");
      } else {
        return res
          .status(404)
          .render("pageNotFoundServer", { message: "User not found" });
      }
    } catch (error) {
      console.error("Error in updateProfile:", error);
      return res
        .status(500)
        .render("pageNotFoundServer", {
          message: "An error occurred while updating the profile",
        });
    }
  };
  
  const editProfileRender = async (req, res) => {
    try {
      res.render("editProfileUser");
    } catch (error) {
      res.status(400).redirect("pageNotFoundServer");
    }
  };
  
  const editProfile = async (req, res) => {
    try {
      const maxAddress = 3; 
      const userId = req.session.user._id;
      console.log('user',userId)
      const googleUserId = req.session.googleId;
 
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
  
      req.session.googleId=googleUserId
  
      const user = await User.findOne({ _id: userId, isBlocked: false });
      const googleUser = await User.findOne({ _id: googleUserId, isBlocked: false });
  
      if (!user && !googleUser) {
        return res.status(404).json({ message: "User not found or blocked" });
      }
  

      let userToUpdate = user || googleUser;
  

      const userAddresses = await Address.find({ userId: userToUpdate._id });
  

      if (userAddresses.length >= maxAddress) {
        return res.status(400).json({ message: `You can only have up to ${maxAddress} addresses.` });
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
  
      const userAddress = new Address({
        userId: userToUpdate._id,
        adress: newAddress,
      });
      
      await userAddress.save(); 
  
     
      const updatedUser = await User.findOneAndUpdate(
        { _id: userToUpdate._id },
        { $push: { address: userAddress._id } },
        { new: true } 
      );
  
      console.log("Updated user: ", updatedUser);
      console.log("Newly added address: ", userAddress);
  

      req.session.user = updatedUser;
      req.session.googleId = googleUserId;
 
      res.render("editProfileUser", {
        message: "Profile updated successfully",
        user: updatedUser,
        adress: userAddress, 
      });
  
    } catch (error) {
      console.error("Error editProfile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
  
  

  const logout = async (req, res) => {
    try {
      req.session.destroy();
      

      return res.redirect("/login");

    } catch (error) {
      if (error) {
        console.log("error in logout");
        res.render("userProfile", { message: "An error occurd cant logout" });
      }
    }
  };


  module.exports={
  userProfile,
  updateProfile,
  editProfileRender,
  editProfile,
  logout,

  }

