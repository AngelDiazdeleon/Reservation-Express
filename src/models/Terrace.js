const mongoose = require('mongoose');

const terraceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  capacity: { type: Number, required: true },
  location: { type: String, required: true },
  images: [{ type: mongoose.Schema.Types.ObjectId }], // ObjectId de archivos en GridFS
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Terrace', terraceSchema);