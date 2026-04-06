const mongoose = require('mongoose');

const seminarSchema = new mongoose.Schema({
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    organizer: {
        type: String,
        required: true,
        trim: true
    },
    venue: {
        type: String,
        required: true,
        trim: true
    },
    duration: {
        type: Number,
        required: true,
        min: 0.1
    },
    certificateTitle: {
        type: String,
        trim: true
    },
    certificateFile: {
        fileName: String,
        fileUrl: String,
        fileType: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SeminarCertificate', seminarSchema);