const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number,
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

const courseOutcomeSchema = new mongoose.Schema({
    outcomeCode: String,
    description: String,
    achieved: {
        type: Boolean,
        default: false
    }
});

const classListSchema = new mongoose.Schema({
    studentId: String,
    studentName: String,
    email: String
});

const subjectSchema = new mongoose.Schema({
    subjectCode: String,
    subjectName: String,
    section: String,
    semester: String,
    courseOutcomes: [courseOutcomeSchema],
    classLists: [classListSchema],
    files: [fileSchema],
    folders: [{
        folderName: String,
        files: [fileSchema],
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
});

const teachingPortfolioSchema = new mongoose.Schema({
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subjects: [subjectSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('TeachingPortfolio', teachingPortfolioSchema);