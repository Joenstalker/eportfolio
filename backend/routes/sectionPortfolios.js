const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const upload = require('../middleware/upload');
const Section = require('../models/Section');
const SectionPortfolio = require('../models/SectionPortfolio');
const { storeEvidenceFile } = require('../services/evidenceStorageService');

const router = express.Router();

const SLOT_NUMBERS = [1, 2, 3, 4];
const EVIDENCE_TYPES = ['instructions', 'studentOutputs', 'ratedRubrics'];

const computeSlotStatus = (slot) => {
  const hasInstructions = Boolean(slot.instructions);
  const hasOutputs = Array.isArray(slot.studentOutputs) && slot.studentOutputs.length > 0;
  const hasRubrics = Array.isArray(slot.ratedRubrics) && slot.ratedRubrics.length > 0;

  if (hasInstructions && hasOutputs && hasRubrics) {
    return 'complete';
  }

  if (hasInstructions || hasOutputs || hasRubrics) {
    return 'in_progress';
  }

  return 'not_started';
};

const buildDefaultSlots = () =>
  SLOT_NUMBERS.map((slotNumber) => ({
    slotNumber,
    courseOutcomeNumber: slotNumber,
    activityNumber: slotNumber,
    title: `Course Outcome ${slotNumber} / Activity ${slotNumber}`,
    notes: '',
    instructions: null,
    studentOutputs: [],
    ratedRubrics: [],
    status: 'not_started',
    updatedAt: new Date()
  }));

const refreshCompletionSummary = (portfolio) => {
  portfolio.slots = (portfolio.slots || []).map((slot) => {
    const slotObj = typeof slot.toObject === 'function' ? slot.toObject() : slot;
    return {
      ...slotObj,
      status: computeSlotStatus(slotObj),
      updatedAt: slotObj.updatedAt || new Date()
    };
  });

  const completedSlots = portfolio.slots.filter((slot) => slot.status === 'complete').length;
  portfolio.completionSummary = {
    completedSlots,
    totalSlots: 4,
    lastUpdated: new Date()
  };
};

const ensureSlotConsistency = (portfolio) => {
  const slotMap = new Map((portfolio.slots || []).map((slot) => [slot.slotNumber, slot]));
  portfolio.slots = SLOT_NUMBERS.map((slotNumber) => {
    const existing = slotMap.get(slotNumber);
    if (existing) {
      const existingObj = typeof existing.toObject === 'function' ? existing.toObject() : existing;
      return {
        ...existingObj,
        courseOutcomeNumber: slotNumber,
        activityNumber: slotNumber,
        title: existingObj.title || `Course Outcome ${slotNumber} / Activity ${slotNumber}`,
        notes: existingObj.notes || '',
        studentOutputs: Array.isArray(existingObj.studentOutputs) ? existingObj.studentOutputs : [],
        ratedRubrics: Array.isArray(existingObj.ratedRubrics) ? existingObj.ratedRubrics : [],
        updatedAt: existingObj.updatedAt || new Date()
      };
    }
    return {
      slotNumber,
      courseOutcomeNumber: slotNumber,
      activityNumber: slotNumber,
      title: `Course Outcome ${slotNumber} / Activity ${slotNumber}`,
      notes: '',
      instructions: null,
      studentOutputs: [],
      ratedRubrics: [],
      status: 'not_started',
      updatedAt: new Date()
    };
  });
};

const getSectionAndAuthorize = async (sectionId, req) => {
  if (!mongoose.Types.ObjectId.isValid(sectionId)) {
    return { error: { status: 400, message: 'Invalid sectionId' } };
  }

  const section = await Section.findById(sectionId)
    .populate('courseId', 'courseCode courseName')
    .populate('facultyId', 'firstName lastName email');

  if (!section) {
    return { error: { status: 404, message: 'Section not found' } };
  }

  if (req.user.role !== 'admin' && String(section.facultyId?._id || section.facultyId) !== String(req.user.id)) {
    return { error: { status: 403, message: 'Access denied for this section' } };
  }

  return { section };
};

const ensurePortfolio = async (section) => {
  let portfolio = await SectionPortfolio.findOne({ sectionId: section._id });

  if (!portfolio) {
    portfolio = new SectionPortfolio({
      facultyId: section.facultyId?._id || section.facultyId,
      courseId: section.courseId?._id || section.courseId,
      sectionId: section._id,
      semester: section.semester,
      slots: buildDefaultSlots()
    });
  } else {
    ensureSlotConsistency(portfolio);
  }

  refreshCompletionSummary(portfolio);
  await portfolio.save();
  return portfolio;
};

const normalizeEvidenceType = (value) => {
  const normalized = String(value || '').trim();
  return EVIDENCE_TYPES.includes(normalized) ? normalized : null;
};

router.use(auth);

router.get('/section/:sectionId', requireRole('faculty', 'admin'), async (req, res) => {
  try {
    const { section, error } = await getSectionAndAuthorize(req.params.sectionId, req);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const portfolio = await ensurePortfolio(section);
    await portfolio.populate('facultyId', 'firstName lastName email');
    await portfolio.populate('courseId', 'courseCode courseName');
    await portfolio.populate('sectionId', 'name semester');

    res.json({ portfolio });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/section/:sectionId/slot/:slotNumber', requireRole('faculty', 'admin'), async (req, res) => {
  try {
    const { section, error } = await getSectionAndAuthorize(req.params.sectionId, req);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const slotNumber = Number(req.params.slotNumber);
    if (!SLOT_NUMBERS.includes(slotNumber)) {
      return res.status(400).json({ message: 'slotNumber must be between 1 and 4' });
    }

    const portfolio = await ensurePortfolio(section);
    const slot = portfolio.slots.find((item) => item.slotNumber === slotNumber);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    if (typeof req.body.title === 'string') {
      slot.title = req.body.title.trim() || slot.title;
    }
    if (typeof req.body.notes === 'string') {
      slot.notes = req.body.notes.trim();
    }
    slot.updatedAt = new Date();
    slot.status = computeSlotStatus(slot);

    refreshCompletionSummary(portfolio);
    await portfolio.save();

    res.json({ slot, completionSummary: portfolio.completionSummary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post(
  '/section/:sectionId/bulk-upload',
  requireRole('faculty', 'admin'),
  upload.any(),
  async (req, res) => {
    try {
      const { sectionId } = req.params;
      const { section, error } = await getSectionAndAuthorize(sectionId, req);
      if (error) return res.status(error.status).json({ message: error.message });

      // Expect files to be sent with fieldnames like 'slot-1-instructions', 'slot-2-studentOutputs', etc.
      const files = Array.isArray(req.files) ? req.files : [];
      const portfolio = await ensurePortfolio(section);

      const filesBySlotAndType = {};
      for (const file of files) {
        const parts = String(file.fieldname || '').split('-');
        // expected: ['slot', '1', 'instructions'] or ['slot', '2', 'studentOutputs']
        if (parts.length >= 3 && parts[0] === 'slot') {
          const slotNumber = Number(parts[1]) || 0;
          const evidenceType = parts.slice(2).join('-');
          if (!filesBySlotAndType[slotNumber]) filesBySlotAndType[slotNumber] = {};
          if (!filesBySlotAndType[slotNumber][evidenceType]) filesBySlotAndType[slotNumber][evidenceType] = [];
          filesBySlotAndType[slotNumber][evidenceType].push(file);
        }
      }

      const facultyName = `${section.facultyId?.firstName || ''} ${section.facultyId?.lastName || ''}`.trim();
      const subjectCode = section.courseId?.courseCode || section.courseId?.courseName || 'subject';
      const sectionName = section.name || 'section';

      const storedMap = {};
      for (const [slotNumStr, types] of Object.entries(filesBySlotAndType)) {
        const slotNumber = Number(slotNumStr);
        storedMap[slotNumber] = storedMap[slotNumber] || {};
        for (const [evidenceType, fileArray] of Object.entries(types)) {
          const storedFiles = [];
          for (const file of fileArray) {
            const stored = await storeEvidenceFile({
              file,
              facultyName,
              subjectCode,
              sectionName,
              slotNumber,
              evidenceType
            });
            storedFiles.push(stored);
          }
          storedMap[slotNumber][evidenceType] = storedFiles;
        }
      }

      // Apply stored files to portfolio slots
      for (const slot of portfolio.slots) {
        const slotNumber = slot.slotNumber;
        const changes = storedMap[slotNumber] || {};
        if (changes.instructions && changes.instructions.length) {
          slot.instructions = changes.instructions[0];
        }
        if (changes.studentOutputs && changes.studentOutputs.length) {
          slot.studentOutputs = [...(slot.studentOutputs || []), ...changes.studentOutputs];
        }
        if (changes.ratedRubrics && changes.ratedRubrics.length) {
          slot.ratedRubrics = [...(slot.ratedRubrics || []), ...changes.ratedRubrics];
        }
        slot.updatedAt = new Date();
        slot.status = computeSlotStatus(slot);
      }

      refreshCompletionSummary(portfolio);
      await portfolio.save();

      res.status(201).json({ message: 'Bulk upload successful', portfolio });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.post(
  '/section/:sectionId/slot/:slotNumber/upload',
  requireRole('faculty', 'admin'),
  upload.array('files', 20),
  async (req, res) => {
    try {
      const { section, error } = await getSectionAndAuthorize(req.params.sectionId, req);
      if (error) {
        return res.status(error.status).json({ message: error.message });
      }

      const slotNumber = Number(req.params.slotNumber);
      if (!SLOT_NUMBERS.includes(slotNumber)) {
        return res.status(400).json({ message: 'slotNumber must be between 1 and 4' });
      }

      const evidenceType = normalizeEvidenceType(req.body.evidenceType || req.query.evidenceType);
      if (!evidenceType) {
        return res.status(400).json({ message: 'evidenceType must be instructions, studentOutputs, or ratedRubrics' });
      }

      const files = Array.isArray(req.files) ? req.files : [];
      if (files.length === 0) {
        return res.status(400).json({ message: 'Please attach at least one file' });
      }

      const portfolio = await ensurePortfolio(section);
      const slot = portfolio.slots.find((item) => item.slotNumber === slotNumber);
      if (!slot) {
        return res.status(404).json({ message: 'Slot not found' });
      }

      const facultyName = `${section.facultyId?.firstName || ''} ${section.facultyId?.lastName || ''}`.trim();
      const subjectCode = section.courseId?.courseCode || section.courseId?.courseName || 'subject';
      const sectionName = section.name || 'section';

      const storedFiles = [];
      for (const file of files) {
        const storedFile = await storeEvidenceFile({
          file,
          facultyName,
          subjectCode,
          sectionName,
          slotNumber,
          evidenceType
        });
        storedFiles.push(storedFile);
      }

      if (evidenceType === 'instructions') {
        slot.instructions = storedFiles[0];
      } else if (evidenceType === 'studentOutputs') {
        slot.studentOutputs = [...(slot.studentOutputs || []), ...storedFiles];
      } else if (evidenceType === 'ratedRubrics') {
        slot.ratedRubrics = [...(slot.ratedRubrics || []), ...storedFiles];
      }

      slot.updatedAt = new Date();
      slot.status = computeSlotStatus(slot);
      refreshCompletionSummary(portfolio);
      await portfolio.save();

      res.status(201).json({
        message: 'Files uploaded successfully',
        slot,
        completionSummary: portfolio.completionSummary
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get('/admin/portfolios', requireRole('admin'), async (req, res) => {
  try {
    const { facultyId, courseId, sectionName } = req.query;
    const query = {};
    if (facultyId && mongoose.Types.ObjectId.isValid(facultyId)) query.facultyId = facultyId;
    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) query.courseId = courseId;

    const portfolios = await SectionPortfolio.find(query)
      .populate('facultyId', 'firstName lastName email department')
      .populate('courseId', 'courseCode courseName')
      .populate('sectionId', 'name semester')
      .sort({ updatedAt: -1 });

    const filtered = portfolios.filter((portfolio) => {
      if (!sectionName) return true;
      const name = String(portfolio.sectionId?.name || '').toLowerCase();
      return name.includes(String(sectionName).toLowerCase());
    });

    res.json({ portfolios: filtered });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
