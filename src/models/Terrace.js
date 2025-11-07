import mongoose from 'mongoose';

const terraceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    capacity: {
        type: Number,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    images: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Terrace = mongoose.model('Terrace', terraceSchema);

export default Terrace;