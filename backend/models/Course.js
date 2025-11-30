const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    courseName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    credits: {
        type: Number,
        required: true,
        min: 1,
        max: 6,
        default: 3
    },
    department: {
        type: String,
        required: true,
        trim: true
    },
    semester: {
        type: String,
        required: true,
        enum: ['Fall 2024', 'Spring 2025', 'Summer 2025', 'Fall 2025']
    },
    maxStudents: {
        type: Number,
        required: true,
        min: 1,
        max: 100,
        default: 30
    },
    prerequisites: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Index for efficient queries
courseSchema.index({ courseCode: 1 });
courseSchema.index({ department: 1 });
courseSchema.index({ semester: 1 });

module.exports = mongoose.model('Course', courseSchema);