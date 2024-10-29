const mongoose = require("mongoose");
const env = require("dotenv");

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("db connected");
    
  } catch (error) {
    console.log("db not connected", error);
    process.exit(1);
  }
};

module.exports = connectDb;
