const mongoose = require("mongoose");
const { Schema } = mongoose; // Use 'Schema' instead of 'schema'
const adressSchema=require('../models/adressSchema')

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: Number,
    required: false, // because phone is not needed in Google login
    unique: false,
    sparse: true, // to set unique constraints
    default:null
    
  },
  googleId: {
    type: String,
    

  },
  password: {
    type: String,
    required: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  cart: [
    {
      type: Schema.Types.ObjectId, 
    },
  ],
  wallet: [
    {
      type: Schema.Types.ObjectId,
      ref: "Wishlist", 
    },
  ],
  address: [
    {
      type: Schema.Types.ObjectId,
      ref: "Adress",
    },
  ],
  orderHistory: [
    {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
  ],
  createdOn: {
    type: Date,
    default: Date.now,
  },
  referenceCode: {
    type: String, 
  },
  redeemed: {
    type: Boolean,
    // default:false
  },
  redeemedUsers: {
    type: Schema.Types.ObjectId,
    ref: "User", 
    //required:true
  },
  searchHistory: [
    {
      category: {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
      brand: {
        type: String,
      },
      searchOn: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const User = mongoose.model("User", userSchema);
module.exports = User;
