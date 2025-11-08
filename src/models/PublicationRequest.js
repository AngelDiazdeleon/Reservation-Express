const mongoose = require('mongoose');

const fileRefSchema = new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
  filename: { type: String },
  mimetype: { type: String }
}, { _id: false });

const publicationRequestSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  terraceData: { type: Object, required: true }, // name, description, capacity, price, contact, etc.
  photos: [fileRefSchema],     // imágenes de la terraza (visibles si se aprueba)
  documents: [fileRefSchema],  // identificaciones / comprobantes (solo para admins)
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PublicationRequest', publicationRequestSchema);