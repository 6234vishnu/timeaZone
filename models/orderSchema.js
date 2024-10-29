const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    address:{
        type: Schema.Types.ObjectId,
        ref: 'Adress',
        required: true
    },
    reviews:[{
         
        type: Schema.Types.ObjectId,
        ref: 'Review',
        required: true
    }],
    couponCode: {
        type: String
        
    },
    discount: {
        type: Number,
        default: 0
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'CreditCard', 'UPI', 'Wallet'],
        required: true
    },

    
    products: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
   
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        required: true,
        default: 'Pending'
    },
    orderStatus: {
        type: String,
        enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled','Returned'],
        required: true,
        default: 'Processing'
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Review',
        },
    ],
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
