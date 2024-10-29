const express = require("express");
const userController = require("../controllers/user/usercontroller");
const passport = require("passport");
const { userAuth } = require("../middlewares/auth");
const router = express.Router();
const {clearCacheUser}=require('../middlewares/clearCache');
const User = require("../models/userSchema");
const userProfile=require("../controllers/user/userProfile")
const ordermanagement=require("../controllers/user/orderManagement")
const addressManagement=require("../controllers/user/addressManagement")
const cartManagement=require("../controllers/user/cartManagement")
const forgotpassword=require("../controllers/user/forgotPassword")
const productManagement=require("../controllers/user/productManagement")
const wishlistManagement=require("../controllers/user/wishlistManagement")
const WalletController=require("../controllers/user/walletController")


//home and signup
router.get("/", userController.loadHomepage);
router.get("/signup", userController.loadSignupPage);
router.post("/signup", userController.signup);

//otp an google verification
router.get("/verifyotpPage", userController.verifyOtpPage);
router.post("/verifyOtp", userController.verifyOtp);
router.post("/resendOtp", userController.resendOtp);
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get("/auth/google/callback",passport.authenticate("google", { failureRedirect: "/signup" }),
  (req, res) => {
    req.session.googleId = req.user._id;
    res.redirect("/");
  }
);

// login and home
router.get('/home', userController.loadHomepage)
router.get("/login",clearCacheUser, userController.loadLoginpage);
router.post("/login", userController.login);
router.post('/loginFromOrder',userController.loadOrderLogin)

// user profile
router.get("/userProfile", userProfile.userProfile);
router.post('/userProfile',userProfile.updateProfile)
router.get("/logout", userProfile.logout);
router.get('/editProfile',userProfile.editProfileRender)
router.post('/editProfile',userProfile.editProfile)

// order management

router.post('/checkOut',ordermanagement.checkout)
router.post("/applyCoupon",ordermanagement.applyCoupon)
router.post('/orderPage',ordermanagement.orderProduct)
router.post('/addAdressOrderPge',ordermanagement.addAdressOrderpge)
// router.get('/orderHistory',ordermanagement.orderHistoryRender)
router.get('/orderConfirmation',ordermanagement.orderConform)
router.get("/orderDetails",ordermanagement.orderDetails)
router.get("/cancelOrder",ordermanagement.cancelOrder)
router.get('/myorders',ordermanagement.orderHistory)
router.get("/orderUpdates/:id",ordermanagement.orderStatusPage)
router.post('/cancel/:Id',ordermanagement.cancelTheOrder)
router.post('/filterOrders',ordermanagement.filterOrders)

//Razorpay
router.post('/createRazorpayOrder',ordermanagement.razorpayOrder)
router.post('/verifyRazorpayPayment',ordermanagement.paymentVerify)


// address management
router.get('/savedAdresses',addressManagement.savedAdress)
router.post("/editSavedAddress",addressManagement.editSavedAd)
router.get('/deleteAdress', addressManagement.deleteAdress);

// cart management
router.get('/cartPage',cartManagement.cartPage)
router.post('/addToCart',cartManagement.addToCart)
router.get('/removeCart/:id',cartManagement.removeFromCart)
router.put('/updateCart',cartManagement.updateCartQnty)

// wishlist Management
router.get('/wishlist',wishlistManagement.wishlistPage)
router.post('/wishlist',wishlistManagement.wishlist)
router.delete("/removeWishlist",wishlistManagement.removeFromWishlist)


//forgot password
router.get("/pageNotfountClient", forgotpassword.pageNotfoundClient);
router.get("/pageNotfoundServer", forgotpassword.pageNotfoundServer);
router.get('/forgotPassword',forgotpassword.loadForgot)
router.post('/forgotPassword',forgotpassword.forgotPassword)
router.get('/verifyOtpForgot',forgotpassword.loadEnterOtp)
router.post('/otpcompareforgot',forgotpassword.otpcompareforgot)
router.get('/newPassword',forgotpassword.newPasswordrender)
router.post('/newpassword',forgotpassword.newPassword)

// product management
router.get('/productPage', productManagement.loadProduct);
router.get('/shop',productManagement.shopPage)
router.get('/filterProducts',productManagement.filterProducts)

//rating management
router.post('/rating/:id',ordermanagement.ratingSubmit)
router.post('/return/:id',ordermanagement.returnOrder)

// wallet Management
router.get("/wallet",WalletController.walletPage)





module.exports = router;
