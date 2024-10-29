const mongoose = require("mongoose");
const { Schema } = mongoose;

const couponSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true 
    },

    discountValue: {
        type: Number,
        required: true,
        min: 0 
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true

    },
 
    startDate: {
        type: Date,
        required: true 
    },
    endDate: {
        type: Date,
        required: true 
    },
  
    isActive:{
        type:Boolean,
        default:true
    },

    usedBy: [{
        type:mongoose.Types.ObjectId,
        ref:"User"
    }],
}, { timestamps: true });

const Coupon = mongoose.model("Coupon", couponSchema);
module.exports = Coupon;
