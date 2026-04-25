const mongoose = require('mongoose');

const evidenceFileSchema = new mongoose.Schema({
  provider: {
    type: String,
    enum: ['local', 'gdrive'],
    default: 'local'
  },
  evidenceType: {
    type: String,
    enum: ['instructions', 'studentOutputs', 'ratedRubrics'],
    required: true
  },
  originalName: String,
  fileName: String,
  mimeType: String,
  size: Number,
  fileUrl: String,
  filePath: String,
  storageFolderPath: String,
  googleDriveFolderPath: String,
  googleDriveFileId: String,
  webViewLink: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const slotSchema = new mongoose.Schema({
  slotNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  courseOutcomeNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  activityNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  title: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  instructions: {
    type: evidenceFileSchema,
    default: null
  },
  studentOutputs: {
    type: [evidenceFileSchema],
    default: []
  },
  ratedRubrics: {
    type: [evidenceFileSchema],
    default: []
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'complete'],
    default: 'not_started'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const sectionPortfolioSchema = new mongoose.Schema({
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
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true,
    unique: true
  },
  semester: {
    type: String,
    required: true
  },
  slots: {
    type: [slotSchema],
    default: []
  },
  completionSummary: {
    completedSlots: {
      type: Number,
      default: 0
    },
    totalSlots: {
      type: Number,
      default: 4
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
}, { timestamps: true });

sectionPortfolioSchema.index({ facultyId: 1, courseId: 1 });

module.exports = mongoose.model('SectionPortfolio', sectionPortfolioSchema);
