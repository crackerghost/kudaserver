// Assuming you are using Mongoose for schema modeling
const mongoose = require('mongoose');

// Define schema
const MapTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    
  }
});

// Create a model from the schema
const MapToken = mongoose.model('MapToken', MapTokenSchema);

module.exports = MapToken;
