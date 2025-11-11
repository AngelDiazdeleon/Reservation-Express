const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  reservation: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Reservation', 
    required: true 
  },
  amount: { type: Number, required: true },
  percentage: { type: Number, default: 5 },
  status: { 
    type: String, 
    enum: ['pending', 'collected', 'refunded'], 
    default: 'pending' 
  },
  collectedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Commission', commissionSchema);