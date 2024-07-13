const mongoose = require('mongoose');
const bcrypt = require("bcrypt");

const regSchema = new mongoose.Schema({
  email: {
    type: String,
    required: false,
    unique: true,
  },
  password: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: false,
  },
  role: {
    type: String,
    required: false,
  },
  kyc: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    required: false,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: false,
    },
    coordinates: {
      type: [Number],
      required: false,
    },
  },
});
regSchema.index({ location: '2dsphere' });

const regModel = mongoose.model("Wastewise", regSchema);

module.exports = regModel;
