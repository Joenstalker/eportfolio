const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: [
      'DASHBOARD_VIEW',
      'DASHBOARD_EDIT',
      'FACULTY_VIEW',
      'FACULTY_CREATE',
      'FACULTY_EDIT',
      'FACULTY_DELETE',
      'FACULTY_ARCHIVE',
      'COURSE_VIEW',
      'COURSE_CREATE',
      'COURSE_EDIT',
      'COURSE_DELETE',
      'COURSE_ASSIGN',
      'REPORTS_VIEW',
      'REPORTS_GENERATE',
      'REPORTS_EXPORT',
      'ACTIVITY_LOGS_VIEW',
      'ACTIVITY_LOGS_EXPORT',
      'SYSTEM_SETTINGS_VIEW',
      'SYSTEM_SETTINGS_EDIT',
      'USER_MANAGEMENT',
      'RBAC_MANAGEMENT',
      'SELF_REGISTRATION_TOGGLE',
      'ADMIN_APPROVAL_TOGGLE',
      'FILE_UPLOAD',
      'FILE_DELETE',
      'SEMINAR_MANAGE',
      'RESEARCH_MANAGE',
      'PROFILE_VIEW',
      'PROFILE_EDIT',
      'CLASS_MANAGEMENT',
      'STUDENT_MANAGEMENT'
    ]
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['DASHBOARD', 'FACULTY', 'COURSE', 'REPORTS', 'SYSTEM', 'FILES', 'SEMINARS', 'RESEARCH', 'PROFILE', 'CLASS']
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Permission', permissionSchema);
