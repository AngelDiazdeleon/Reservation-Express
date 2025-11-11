const mongoose = require('mongoose');

const terraceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  capacity: { type: Number, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  rating: { type: Number, default: 0 },
  amenities: [{ type: String }],
  contactPhone: { type: String },
  contactEmail: { type: String },
  
  // SISTEMA GRIDFS - Archivos en MongoDB
  images: [{ 
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
    filename: { type: String },
    mimetype: { type: String },
    isMain: { type: Boolean, default: false } // Imagen principal
  }],
  
  // Estado y publicación
  status: { 
    type: String, 
    enum: ['draft', 'pending', 'approved', 'rejected', 'published'],
    default: 'draft'
  },
  isAvailable: { type: Boolean, default: true },
  
  // Relaciones
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  publicationRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'PublicationRequest' },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

terraceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Terrace', terraceSchema);