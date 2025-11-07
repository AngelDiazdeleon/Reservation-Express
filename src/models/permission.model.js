const mongoose = require('mongoose');

const PermissionSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    resource: { type: String, required: true, trim: true },
    actions: [{ type: String, trim: true }]
}, { timestamps: true });

module.exports = mongoose.model('Permission', PermissionSchema);