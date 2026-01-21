const mongoose = require('mongoose');

const extensionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    startDate: {
        type: Date,
        required: false
    },
    endDate: {
        type: Date,
        required: false
    },
    venue: {
        type: String,
        required: false
    },
    beneficiaries: {
        type: String,
        required: false
    },
    numberOfParticipants: {
        type: Number,
        required: false
    },
    partners: {
        type: String,
        required: false
    },
    budget: {
        type: Number,
        required: false
    },
    outcomes: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['Planning', 'Ongoing', 'Completed', 'Cancelled'],
        default: 'Planning'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Extension', extensionSchema);