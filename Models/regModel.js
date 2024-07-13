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
  firstName: {
    type: String,
    required: false,
  },
  lastName: {
    type: String,
    required: false,
  },
  cityName:{
   type: String,
   required : false,

  },
  role: {
    type: String,
    required: false,
  },
  kyc: {
    type: String,
    required: false,
  },
  idProof: {
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
  items: [
    {
      name: {
        type: String,
        required: true,
      },
      pricePerKg: {
        type: Number,
        required: true,
      },
    },
  ],
  requests: [
    {
      requesterEmail: {
        type: String,
        required: true,
      },
      requesterLocation: {
        type: {
          type: String,
          enum: ['Point'],
          required: true,
        },
        coordinates: {
          type: [Number],
          required: true,
        },
      },
      recipientEmail: {
        type: String,
        required: true,
      },
      scheduledTime: { type: Date, required: false}, 
      status: {
        type: String,
        default: 'Pending',
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});
regSchema.index({ location: '2dsphere' });

const regModel = mongoose.model("Wastewise", regSchema);

module.exports = regModel;
