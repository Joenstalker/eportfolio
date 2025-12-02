// models/Lock.js
const mongoose = require('mongoose');

const lockSchema = new mongoose.Schema({
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'resourceType'
    },
    resourceType: {
        type: String,
        required: true,
        enum: ['Course'],
        default: 'Course'
    },
    userId: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    lockType: {
        type: String,
        enum: ['WRITE', 'READ'],
        default: 'WRITE'
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 15 * 60 * 1000)
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for cleanup
lockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Create and export the model
const Lock = mongoose.model('Lock', lockSchema);
module.exports = Lock;