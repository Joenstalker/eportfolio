const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    fileUrl: {
        type: String,
        required: true
    },
    fileType: String,
    section: String,
    topic: String,
    isPublic: {
        type: Boolean,
        default: false
    },
    uploadDate: {
        type: Date,
        default: Date.now
    }
});

const classPortfolioSchema = new mongoose.Schema({
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subjectCode: {
        type: String,
        required: true
    },
    subjectName: {
        type: String,
        required: true
    },
    materials: [materialSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('ClassPortfolio', classPortfolioSchema);