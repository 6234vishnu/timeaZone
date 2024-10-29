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
const Wishlist = require("../../models/whislistSchema");
const Wallet=require("../../models/walletSchema")



const walletPage = async (req, res) => {
    try {
        if (req.session.user || req.session.googleId) {
            const userId = req.session?.user?._id || req.session.googleId;
            const page = parseInt(req.query.page) || 1;
            const limit = 5;

            const orders = await Order.find({ 
                user: userId, 
                orderStatus: { $in: ["Cancelled", "Returned"] } 
            })
            console.log("ooooh",orders)
           

            const totalOrders = await Order.countDocuments({ 
                user: userId, 
                orderStatus: { $in: ["Cancelled", "Returned"] } 
            });
            const totalPages = Math.ceil(totalOrders / limit);

            let totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);

           
            let wallet = await Wallet.findOne({ user: userId })
            console.log("userId",userId)
            console.log("walletFound",wallet)
            const orderCount = wallet ? wallet.orders.length : 0; 

            if (!wallet) {
                wallet = new Wallet({
                    user: userId,
                    orders: orders._id,
                    balance: totalAmount
                });
                await wallet.save();
            }

            console.log("Order Count in Wallet:", orderCount);
            console.log("Current Page:", page);
            console.log("wallet:",wallet.orders);

            return res.render("wallet", { 
                wallet: wallet, 
                orders: orders,
                orderCount: orderCount,   
                currentPage: page,
                totalPages: totalPages
            });
        }

        return res.redirect("/login");
    } catch (error) {
        res.status(500).send("Server error");
        console.log("Error in walletPage: ", error);
    }
};





module.exports={

    walletPage,

}