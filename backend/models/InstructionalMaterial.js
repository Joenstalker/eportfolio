const mongoose = require('mongoose');

const instructionalMaterialSchema = new mongoose.Schema({
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
    title: {
        type: String,
        required: true
    },
    description: String,
    type: {
        type: String,
        enum: ['lecture', 'assignment', 'quiz', 'exam', 'project', 'presentation', 'handout', 'video', 'other'],
        required: true
    },
    section: String,
    topic: String,
    isPublic: {
        type: Boolean,
        default: false
    },
    file: {
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
    tags: [String]
}, {
    timestamps: true
});

module.exports = mongoose.model('InstructionalMaterial', instructionalMaterialSchema);