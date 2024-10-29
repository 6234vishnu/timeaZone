const mongoose = require("mongoose");
const { Schema } = mongoose;

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    discription: {
        type: String,
        required: true
    },
    parentCategory: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        default: null // Allows for nested categories
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isBlocked:{
        type:Boolean,
        default:false,
    },
    isListed:{
        type:Boolean,
        default:true
    },
    categoryOffer: {
        type: Number,
        default: 0, // Default to 0% if no offer is applied
      },
}, { timestamps: true });

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
