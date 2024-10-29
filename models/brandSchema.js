const mongoose = require("mongoose");
const { Schema } = mongoose;

const brandSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'inactive'], 
        default: 'active'
    },
    logo: {
        type: String,
       
    }
}, { timestamps: true });

const Brand = mongoose.model("Brand", brandSchema);
module.exports = Brand;

