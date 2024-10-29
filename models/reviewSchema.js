const mongoose = require('mongoose');
const { Schema } = mongoose;


const reviewSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', 
        required: false,
    },
    rating: {
        type: Number,
        required: true,
        min: 1, 
        max: 5,
    },
    review: {
        type: String,
        required: true,
        maxlength: 500, 
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});


const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
