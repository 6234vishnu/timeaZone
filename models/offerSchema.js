const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  offerName: {
    type: String,
    required: true,
  },
  offerCode: {
    type: String,
    required: true,
    unique: true,
  },
  discountType: {
    type: String,
    enum: ['Fixed'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
  },
  minimumOrderAmount: {
    type: Number,
    required: false,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },

  isActive: {
    type: Boolean,
    default: true, 
  },


  product: {
    
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
    },
   
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save middleware to update `updatedAt` field

offerSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer;
