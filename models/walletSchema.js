const mongoose = require("mongoose");
const { Schema } = mongoose;

const transactionSchema = new Schema({
    type: { 
        type: String, 
        enum: ['credit', 'debit'], 
        required: true 
    },
    amount: { 
        type: Number, 
        required: true 
    },
    date: { 
        type: Date, 
        default: Date.now 
    },
    order: { 
        type: Schema.Types.ObjectId, 
        ref: 'Order' 
    }
});

const walletSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    balance: {
        type: Number,
        default: 0 
    },
    transactions: [transactionSchema], // Array of transactions (credit/debit)
    orders: [{
        type: Schema.Types.ObjectId,
        ref: 'Order' 
    }]
}, { timestamps: true });

const Wallet = mongoose.model("Wallet", walletSchema);
module.exports = Wallet;
