const SectionActivity = require('../models/SectionActivity');
const Section = require('../models/Section');
const mongoose = require('mongoose');
const path = require('path');

const ALLOWED_FILE_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);

exports.createActivity = async (req, res) => {
  try {
    const { sectionId, title, description } = req.body;

    if (!sectionId || !title) {
      return res.status(400).json({ message: 'sectionId and title are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      return res.status(400).json({ message: 'Invalid sectionId' });
    }

    const section = await Section.findById(sectionId).select('facultyId');
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    if (req.user?.role !== 'admin' && String(section.facultyId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied for this section' });
    }

    let instructionsFile = null;
    if (req.file) {
      const ext = path.extname(req.file.originalname || '').toLowerCase();
      if (!ALLOWED_FILE_EXTENSIONS.has(ext)) {
        return res.status(400).json({ message: 'Only PDF, DOC, and DOCX files are allowed for instructions' });
      }

      instructionsFile = {
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      };
    }

    const activity = new SectionActivity({
      sectionId,
      title: String(title).trim(),
      description: (description || '').trim(),
      instructionsFile
    });

    await activity.save();
    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getActivitiesBySection = async (req, res) => {
  try {
    const { sectionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      return res.status(400).json({ message: 'Invalid sectionId' });
    }

    const section = await Section.findById(sectionId).select('facultyId');
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    if (req.user?.role !== 'admin' && String(section.facultyId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied for this section' });
    }

    const activities = await SectionActivity.find({ sectionId }).sort({ createdAt: -1 });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
