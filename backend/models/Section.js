const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  name: { type: String, required: true, trim: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  semester: {
    type: String,
    required: true,
    enum: ['First Semester', 'Second Semester']
  }
}, { timestamps: true });

sectionSchema.index({ courseId: 1, facultyId: 1, semester: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);
