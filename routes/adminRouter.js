const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/adminController");
const customerControler = require("../controllers/admin/customerControler");
const { userAuth, adminAuth } = require("../middlewares/auth");
const { clearCacheAdmin } = require("../middlewares/clearCache");
const categoryController = require("../controllers/admin/categoryController");
const brandController = require("../controllers/admin/brandController");
const upload = require("../helpers/multer");
const productController = require("../controllers/admin/productController");
const orderController = require("../controllers/admin/orderController");
const couponController = require("../controllers/admin/couponController");
const OfferController = require("../controllers/admin/OfferController");
const salesController = require("../controllers/admin/salesController");

// admin login
router.get("/pageError", adminController.pageNotfoundServer);
router.get("/login", clearCacheAdmin, adminController.loadLoginPage);
router.post("/login", adminController.login);
router.get("/adminLogout", adminAuth, adminController.adminlogout);
router.get("/forgotPassword", adminAuth, adminController.forgotPasswordAdmin);
router.post("/resendOtp", adminAuth, adminController.resendOtp);
router.post("/forgotPassword", adminAuth, adminController.forgotPasswordEmail);
router.post(
  "/otpcompareforgotAdmin",
  adminAuth,
  adminController.otpcompareforgotAdmin
);
router.get("/newPasswordAdmin", adminController.newPasswordrender);
router.post("/newpasswordAdmin", adminController.newPasswordAdmin);

// Admin Dashboard
router.get("/adminDashboard", adminAuth, adminController.loadDashboard);
router.get("/dashboardData", adminAuth, adminController.dashboardGraph);

// user management
router.get("/users", adminAuth, customerControler.customerInfo);
router.get("/blockCustomer", adminAuth, customerControler.customerBlock);
router.get("/unBlockCustomer", adminAuth, customerControler.unBlockCustomer);

// category management
router.get("/category", adminAuth, categoryController.categoryInfo);
router.get("/addCategory", adminAuth, categoryController.addCategoryPage);
router.post("/addCategory", adminAuth, categoryController.addCategory);
router.get("/blockCategory", adminAuth, categoryController.blockCategory);
router.get("/unBlockCategory", adminAuth, categoryController.unBlockCategory);
router.get(
  "/editCategoryrender",
  adminAuth,
  categoryController.editCategoryrender
);
router.post("/editCategory", adminAuth, categoryController.editCategory);
router.get("/addOffer", adminAuth, categoryController.addOffer);

// brand Management
router.get("/addBrand", adminAuth, brandController.getBrandPage);
router.post(
  "/addBrand",
  adminAuth,
  upload.single("logo"),
  brandController.addBrand
);
router.get("/blockBrand", adminAuth, brandController.blockBrand);
router.get("/unblockBrand", adminAuth, brandController.unblockBrand);
router.get("/deleteBrand", adminAuth, brandController.deleteBrand);

//product management
router.get("/products", adminAuth, productController.loadProductPage);
router.get("/blockProduct", adminAuth, productController.blockProduct);
router.get("/unblockProduct", adminAuth, productController.unblockProduct);
router.get("/addProducts", adminAuth, productController.addProductPage);
router.post(
  "/addProducts",
  upload.array("images", 3),
  productController.addProducts
);
router.get("/editProduct/:id", adminAuth, productController.editProduct);
router.post(
  "/editProducts/:productId",
  upload.array("images", 3),
  productController.updateProduct
);
router.delete(
  "/deleteProductImage/:productId",
  adminAuth,
  productController.deleteProductImage
);
router.post(
  "/editProduct/:productId",
  upload.single("images"),
  productController.uploadCroppedImage
);

//orders Management
router.get("/order", adminAuth, orderController.editOrder);
router.post("/submitData", adminAuth, orderController.editStatus);
router.get("/orderDetails", adminAuth, orderController.orderDetails);

//coupon Management

router.get("/coupon", adminAuth, couponController.couponRender);
router.get("/createCouponPage", adminAuth, couponController.couponCreateRender);
router.post("/createCoupon", adminAuth, couponController.couponCreate);
router.get("/UnblockCoupon", adminAuth, couponController.unBlockCoupon);
router.get("/blockCoupon", adminAuth, couponController.blockCoupon);
router.get("/searchCoupons", adminAuth, couponController.searchCoupon);

// Offer Management
router.get("/offerPage", adminAuth, OfferController.offerPage);
router.get("/createOfferPage", adminAuth, OfferController.createOffer);
router.post("/createOffer", adminAuth, OfferController.createNewOffer);
router.get("/offerDetails", adminAuth, OfferController.offerDetails);
router.get("/searchOffer", adminAuth, OfferController.searchOffer);
router.get("/blockOffer", adminAuth, OfferController.blockOffer);
router.get("/UnblockOffer", adminAuth, OfferController.unBlockOffer);

// sales Management

router.get("/salesPage", adminAuth, salesController.salesPage);
router.get("/excelDownload", adminAuth, salesController.excelDownload);

module.exports = router;
