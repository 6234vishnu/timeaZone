const { ServerHeartbeatFailedEvent } = require("mongodb");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const adressSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  adress: {
    adressType: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    building: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      required: true,
    },
  },
});

const Adress = mongoose.model("Adress", adressSchema);
module.exports = Adress;
