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
        enum: ['draft', 'submitted', 'published'],
        default: 'draft'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Research', researchSchema);