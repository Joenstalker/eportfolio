const mongoose = require('mongoose');

const researchSchema = new mongoose.Schema({
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: String,
    abstract: String,
    authors: [String],
    publicationDate: Date,
    journal: String,
    doi: String,
    researchType: {
        type: String,
        enum: ['journal-article', 'conference-paper', 'book-chapter', 'review-paper', 'patent', 'other'],
        required: true
    },
    file: {
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
        enum: ['draft', 'submitted', 'published', 'in-progress'],
        default: 'draft'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Research', researchSchema);