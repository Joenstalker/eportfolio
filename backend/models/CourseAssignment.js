const mongoose = require('mongoose');

const courseAssignmentSchema = new mongoose.Schema({
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    semester: {
        type: String,
        required: true,
        enum: ['Fall 2024', 'Spring 2025', 'Summer 2025', 'Fall 2025']
    },
    section: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        default: 'A'
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Compound unique index to prevent duplicate assignments
courseAssignmentSchema.index({ 
    facultyId: 1, 
    courseId: 1, 
    semester: 1 
}, { 
    unique: true 
});

module.exports = mongoose.model('CourseAssignment', courseAssignmentSchema);