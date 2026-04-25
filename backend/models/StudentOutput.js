const mongoose = require('mongoose');

const studentOutputSchema = new mongoose.Schema({
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  file: String, // file path or URL
  score: Number,
  feedback: String,
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudentOutput', studentOutputSchema);
