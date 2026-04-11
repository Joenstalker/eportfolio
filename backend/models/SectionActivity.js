const mongoose = require('mongoose');

const sectionActivitySchema = new mongoose.Schema({
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  title: { type: String, required: true, trim: true },
  description: {
    type: String,
    default: ''
  },
  instructionsFile: {
    fileName: String,
    fileUrl: String,
    filePath: String,
    fileType: String,
    fileSize: Number
  }
}, { timestamps: true });

sectionActivitySchema.index({ sectionId: 1, createdAt: -1 });

module.exports = mongoose.model('SectionActivity', sectionActivitySchema);
