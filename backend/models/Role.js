const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STAFF', 'DEPARTMENT_HEAD', 'REPORT_VIEWER']
  },
  description: {
    type: String,
    required: true
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  canSelfRegister: {
    type: Boolean,
    default: false
  },
  requiresAdminApproval: {
    type: Boolean,
    default: true
  },
  departmentAccess: [{
    type: String,
    enum: ['Computer Science', 'Information Technology', 'Engineering', 'Business', 'Arts', 'Science', 'Mathematics', 'All']
  }],
  customPermissions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Role', roleSchema);
