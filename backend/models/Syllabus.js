const mongoose = require('mongoose');

const syllabusSchema = new mongoose.Schema({
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subjectCode: {
        type: String,
        required: true
    },
    subjectName: String,
    section: String,
    semester: String,
    syllabusFile: {
        fileName: String,
        fileUrl: String,
        filePath: String,
        fileType: String,
        fileSize: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    },
    version: {
        type: String,
        default: '1.0'
    },
    status: {
        type: String,
        enum: ['draft', 'submitted', 'approved', 'rejected'],
        default: 'draft'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Syllabus', syllabusSchema);