const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: String,
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  section: { type: String, required: true, trim: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  instructionsFile: String, // file path or URL
  rubricFile: String,       // file path or URL
  maxScore: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
