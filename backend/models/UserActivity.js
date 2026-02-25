const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGOUT',
      'PROFILE_UPDATE',
      'COURSE_CREATE',
      'COURSE_UPDATE',
      'COURSE_DELETE',
      'FACULTY_CREATE',
      'FACULTY_UPDATE',
      'FACULTY_ARCHIVE',
      'FACULTY_UNARCHIVE',
      'ASSIGNMENT_CREATE',
      'ASSIGNMENT_UPDATE',
      'ASSIGNMENT_DELETE',
      'FILE_UPLOAD',
      'FILE_DELETE',
      'REPORT_GENERATE',
      'SEMINAR_CREATE',
      'SEMINAR_UPDATE',
      'SEMINAR_DELETE',
      'RESEARCH_CREATE',
      'RESEARCH_UPDATE',
      'RESEARCH_DELETE'
    ]
  },
  resourceType: {
    type: String,
    enum: ['USER', 'COURSE', 'ASSIGNMENT', 'FILE', 'SEMINAR', 'RESEARCH', 'REPORT']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  description: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  duration: {
    type: Number, // in milliseconds
    default: 0
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
userActivitySchema.index({ userId: 1, timestamp: -1 });
userActivitySchema.index({ action: 1, timestamp: -1 });
userActivitySchema.index({ timestamp: -1 });

module.exports = mongoose.model('UserActivity', userActivitySchema);
