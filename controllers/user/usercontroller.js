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

const loadHomepage = async (req, res) => {
  try {
    const user = req.session.user;

    const product = await Product.find({ isBlocked: false });
    const category = await Category.find({ isBlocked: false });
    const brand = await Brand.find({ isBlocked: false });
    if (user) {
      const userData = await User.findOne({ _id: user, isBlocked: false });
      req.session.user = userData;

      res.render("home", {
        user: userData,
        product: product,
        category: category,
        brand: brand,
      });
    } else {
      res.render("home", {
        product: product,
        category: category,
        brand: brand,
      });
    }
  } catch (error) {
    return res.status(500).send("Server error");
  }
};

const loadLoginpage = async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.render("login");
  } catch (error) {
    if (error) {
      res.status(500).send("server error");
    }
  }
};

// to load the signup page
const loadSignupPage = async (req, res) => {
  try {
    res.render("signup");
  } catch (error) {
    if (error) {
      res.status(500).send("server error");
    }
  }
};
// TO set up the otp and mail verification
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendEmailVerification = async (email, otp) => {
  try {
    const transporter = nodeMailer.createTransport({
      service: "gmail",
      requireTLS: true,
      auth: {
        user: process.env.NODEEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });
    const info = await transporter.sendMail({
      from: process.env.NODEEMAILER_EMAIL,
      to: email,
      subject: "verify your account",
      html: `<b> your otp :${otp}</b>`,
    });
    if (info.accepted.length > 0) {
      return true;
    } else {
      console.error("Email not accepted:", info);
      return false;
    }
  } catch (error) {
    console.error("error in sending email", error);
    return false;
  }
};

// signup function
const signup = async (req, res) => {
  const { name, phone, email, password, confirmPassword } = req.body;
  try {
    if (password != confirmPassword) {
      return res.render("signup", { message: "the password are not matched" });
    }
    const findUser = await User.findOne({ email });
    if (findUser) {
      return res.render("signup", {
        message: "user already exists with same id",
      });
    }
    let otp = generateOtp();

    const sentEmail = await sendEmailVerification(email, otp);

    if (!sentEmail) {
      return res.json("email-error");
    }

    req.session.userOtp = otp;
    req.session.userData = { name, phone, email, password };
    res.redirect("/verifyOtpPage");
  } catch (error) {
    if (error) {
      res.redirect("/pageNotfoundServer");
    }
  }
};
// to secure pASSWORD
async function securePassword(password) {
  try {
    const passwordHash = await bcrypt.hash(password, 10);

    return passwordHash;
  } catch (error) {
    console.error("Error securing password:", error);
    throw error;
  }
}
const verifyOtpPage = (req, res) => {
  try {
    res.render("verifyOtp");
  } catch (error) {
    res.status(500).send("Server Error");
  }
};

// TO verify otp
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (otp === req.session.userOtp) {
      const user = req.session.userData;

      const passwordHash = await securePassword(user.password);

      const saveUserdata = new User({
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: passwordHash,
      });

      await saveUserdata.save();
      req.session.user = saveUserdata._id;
      res
        .status(200)
        .json({ success: true, message: "Success", redirectUrl: "/" });
    } else {
      res
        .status(400)
        .json({ sucess: false, messages: "invalid otp please try again" });
    }
  } catch (error) {
    res.status(500).json({ sucess: false, message: "an error occured" });
  }
};
// resending otp
const resendOtp = async (req, res) => {
  try {
    const { email } = req.session.userData;

    if (!email) {
      res.status(400).json({
        success: false,
        message: "email not filled",
      });
    }
    const otp = generateOtp();
    req.session.userOtp = otp;
    const emailSend = sendEmailVerification(email, otp);

    if (emailSend) {
      res.status(200).json({
        success: false,
        message: "otp resend sucessfully",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "otp is not resend ",
      });
    }
  } catch (error) {
    if (error) {
      res.status(500).json({
        success: false,
        message: "Error occurred while resending OTP",
      });
    }
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const findUser = await User.findOne({
      isAdmin: 0,
      email: email,
      isBlocked: false,
    });

    if (!findUser) {
      return res.render("login", {
        message: "user not found please Signup first",
      });

      if (findUser.isBlocked === true) {
        return res.render("login", { message: " user is blocked by admin" });
      }
    }

    const passwordMatch = bcrypt.compare(password, findUser.password);
    if (!passwordMatch) {
      return res.render("login", { message: "password is not correct" });
    } else {
      req.session.user = findUser;

      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      res.redirect("/");
    }
  } catch (error) {
    if (error) {
      return res.render("login", {
        message: "serverside error , plese try after some time",
      });
    }
  }
};

const loadOrderLogin = async (req, res) => {
  try {
    if (!req.session.user) {
      const { email, password } = req.body;
      const findUser = await User.findOne({
        isAdmin: 0,
        email: email,
        isBlocked: false,
      });

      if (!findUser) {
        return res.render("orderPageUser", {
          message: "User not found please Signup first",
        });

        if (findUser.isBlocked === true) {
          return res.render("orderPageUser", {
            message: " user is blocked by admin",
          });
        }
      }

      const passwordMatch = bcrypt.compare(password, findUser.password);
      if (!passwordMatch) {
        return res.render("orderPageUser", {
          message: "password is not correct",
        });
      } else {
        req.session.user = findUser;

        res.redirect("/orderPage");
      }
    } else {
      res.redirect("/orderPage", { message: "you are already logged in " });
    }
  } catch (error) {
    if (error) {
      return res.render("orderPageUser", {
        message: "serverside error , plese try after some time",
      });
    }
  }
};

module.exports = {
  loadHomepage,
  loadLoginpage,
  loadSignupPage,
  signup,
  verifyOtpPage,
  verifyOtp,
  resendOtp,
  login,
  loadOrderLogin,
};
