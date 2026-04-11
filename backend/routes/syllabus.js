const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const Syllabus = require('../models/Syllabus');
const Course = require('../models/Course');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const CORRUPTED_FILE_MESSAGE = 'File corrupted (upload failed)';
const EXISTING_SYLLABUS_MESSAGE = 'Syllabus exists (overwrite existing file)';
const VALID_SEMESTERS = ['First Semester', 'Second Semester'];
const STORAGE_FULL_THRESHOLD_MB = Number(process.env.STORAGE_FULL_THRESHOLD_MB || 50);
const uploadStoragePath = path.join(__dirname, '../uploads');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const removeUploadedFile = async (filePath) => {
    if (!filePath) {
        return;
    }

    try {
        await fs.unlink(filePath);
    } catch (deleteError) {
        console.error('Failed to remove uploaded file:', deleteError);
    }
};

const hasPdfSignature = (buffer) => buffer.toString('ascii', 0, 5) === '%PDF-';
const hasDocxSignature = (buffer) => buffer.slice(0, 2).toString('ascii') === 'PK';
const hasDocSignature = (buffer) => buffer.slice(0, 8).equals(Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]));

const isCorruptedSyllabusFile = async (file) => {
    if (!file || !file.path || !file.originalname) {
        return true;
    }

    if (!file.size || file.size <= 0) {
        return true;
    }

    const extension = path.extname(file.originalname).toLowerCase();
    const handle = await fs.open(file.path, 'r');

    try {
        const headerBuffer = Buffer.alloc(8);
        const { bytesRead } = await handle.read(headerBuffer, 0, 8, 0);

        if (!bytesRead || bytesRead < 4) {
            return true;
        }

        if (extension === '.pdf') {
            return !hasPdfSignature(headerBuffer);
        }

        if (extension === '.docx') {
            return !hasDocxSignature(headerBuffer);
        }

        if (extension === '.doc') {
            return !hasDocSignature(headerBuffer);
        }

        return false;
    } finally {
        await handle.close();
    }
};

const validateSyllabusFields = (payload) => {
    const subjectCode = (payload.subjectCode || '').trim();
    const subjectName = (payload.subjectName || '').trim();
    const academicYearRaw = (payload.academicYear || payload.section || '').trim();
    const semester = (payload.semester || '').trim();

    if (!subjectCode) {
        return 'Subject Code is required';
    }

    // Require subject codes like CS01 (must start with letters and include a number).
    if (!/^(?=.{2,20}$)(?=.*\d)[A-Za-z][A-Za-z0-9-]*$/.test(subjectCode)) {
        return 'Subject Code format is invalid (use format like CS01)';
    }

    if (!subjectName) {
        return 'Subject Name is required';
    }

    if (!/^[A-Za-z0-9][A-Za-z0-9\s.,&()/-]{2,99}$/.test(subjectName)) {
        return 'Subject Name format is invalid';
    }

    if (academicYearRaw) {
        const yearMatch = academicYearRaw.match(/^(\d{4})-(\d{4})$/);
        if (!yearMatch) {
            return 'Academic Year format is invalid (use YYYY-YYYY)';
        }

        const firstYear = Number(yearMatch[1]);
        const secondYear = Number(yearMatch[2]);
        if (secondYear !== firstYear + 1) {
            return 'Academic Year range is invalid';
        }
    }

    if (!semester) {
        return 'Semester is required';
    }

    if (!VALID_SEMESTERS.includes(semester)) {
        return 'Semester value is invalid';
    }

    return null;
};

const shouldSimulateStorageFull = () => process.env.SIMULATE_STORAGE_FULL === 'true';

const getUploadStorageStatus = async () => {
    if (shouldSimulateStorageFull()) {
        return {
            isFull: true,
            message: 'Storage full (contact admin)',
            freeBytes: 0,
            thresholdBytes: STORAGE_FULL_THRESHOLD_MB * 1024 * 1024,
            simulated: true
        };
    }

    const thresholdBytes = STORAGE_FULL_THRESHOLD_MB * 1024 * 1024;

    try {
        const stats = await fs.statfs(uploadStoragePath);
        const freeBlocks = Number(stats.bavail ?? stats.bfree ?? 0);
        const blockSize = Number(stats.bsize ?? 0);
        const freeBytes = freeBlocks * blockSize;
        const isFull = freeBytes <= thresholdBytes;

        return {
            isFull,
            message: isFull ? 'Storage full (contact admin)' : 'Storage available',
            freeBytes,
            thresholdBytes,
            simulated: false
        };
    } catch (error) {
        console.error('Error checking storage status:', error);
        return {
            isFull: false,
            message: 'Storage status unavailable',
            freeBytes: null,
            thresholdBytes,
            simulated: false
        };
    }
};

const syllabusFileUpload = (req, res, next) => {
    if (shouldSimulateStorageFull()) {
        return res.status(507).json({ message: 'Storage full (contact admin)' });
    }

    upload.single('syllabusFile')(req, res, (error) => {
        if (error) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'File too large (upload failed)' });
            }

            const isStorageFullError = error.code === 'ENOSPC' || /no space left on device/i.test(error.message || '');
            if (isStorageFullError) {
                return res.status(507).json({ message: 'Storage full (contact admin)' });
            }

            return next(error);
        }

        next();
    });
};

// Get all syllabi
router.get('/', auth, async (req, res) => {
    try {
        const syllabi = await Syllabus.find({ facultyId: req.user.id });
        res.json(syllabi);
    } catch (error) {
        console.error('Error fetching syllabi:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/storage-status', auth, async (req, res) => {
    try {
        const status = await getUploadStorageStatus();
        res.json(status);
    } catch (error) {
        console.error('Error fetching storage status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload syllabus with file
router.post('/', auth, syllabusFileUpload, async (req, res) => {
    try {
        const { subjectCode, subjectName, section, semester, version, academicYear } = req.body;

        const fieldError = validateSyllabusFields(req.body);
        if (fieldError) {
            await removeUploadedFile(req.file?.path);
            return res.status(400).json({ message: fieldError });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Please select a syllabus file' });
        }

        const fileExt = path.extname(req.file.originalname || '').toLowerCase();
        const isPdfMime = req.file.mimetype === 'application/pdf';
        const isPdf = isPdfMime || fileExt === '.pdf';

        if (!isPdf) {
            await removeUploadedFile(req.file.path);
            return res.status(400).json({ message: 'Invalid format (PDF only)' });
        }

        const normalizedSubjectCode = subjectCode.trim();
        const normalizedSubjectName = subjectName.trim();
        const normalizedSemester = semester.trim();
        const normalizedSection = (academicYear || section || '').trim();

        const existingSyllabus = await Syllabus.findOne({
            facultyId: req.user.id,
            subjectCode: {
                $regex: new RegExp(`^${escapeRegExp(normalizedSubjectCode)}$`, 'i')
            }
        });

        if (existingSyllabus) {
            await removeUploadedFile(req.file.path);
            return res.status(400).json({ message: EXISTING_SYLLABUS_MESSAGE });
        }

        const corruptedFile = await isCorruptedSyllabusFile(req.file);
        if (corruptedFile) {
            await removeUploadedFile(req.file.path);
            return res.status(400).json({ message: CORRUPTED_FILE_MESSAGE });
        }

        const syllabus = new Syllabus({
            facultyId: req.user.id,
            subjectCode: normalizedSubjectCode,
            subjectName: normalizedSubjectName,
            section: normalizedSection,
            semester: normalizedSemester,
            version: version || '1.0',
            syllabusFile: {
                fileName: req.file.originalname,
                fileUrl: `/uploads/${req.file.filename}`,
                filePath: req.file.path,
                fileType: req.file.mimetype,
                fileSize: req.file.size
            }
        });

        await syllabus.save();

        // Ensure a Course record exists for this subject code so the frontend
        // can show the course in Assigned Courses and allow creating sections.
        try {
            const normalizedCourseCode = String(normalizedSubjectCode || '').toUpperCase().trim();
            const existingCourse = await Course.findOne({ courseCode: normalizedCourseCode });
            if (!existingCourse) {
                const courseDoc = new Course({
                    courseCode: normalizedCourseCode,
                    courseName: normalizedSubjectName || normalizedCourseCode,
                    department: 'Unassigned',
                    semester: normalizedSemester || 'TBD'
                });

                // Ignore any errors creating the course (e.g., race conditions)
                try {
                    await courseDoc.save();
                    console.log('Created course for syllabus:', courseDoc.courseCode);
                } catch (createErr) {
                    console.error('Failed to create course for syllabus:', createErr?.message || createErr);
                }
            }
        } catch (e) {
            console.error('Error ensuring course exists for syllabus:', e?.message || e);
        }

        console.log('Syllabus uploaded successfully:', syllabus);
        res.json({
            message: 'Syllabus uploaded successfully',
            syllabus
        });
    } catch (error) {
        console.error('Error uploading syllabus:', error);
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large (upload failed)' });
        }

        const isStorageFullError = error.code === 'ENOSPC' || /no space left on device/i.test(error.message || '');
        if (isStorageFullError) {
            return res.status(507).json({ message: 'Storage full (contact admin)' });
        }

        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get syllabus by subject
router.get('/subject/:subjectCode', auth, async (req, res) => {
    try {
        const syllabus = await Syllabus.findOne({
            facultyId: req.user.id,
            subjectCode: req.params.subjectCode
        });
        res.json(syllabus);
    } catch (error) {
        console.error('Error fetching syllabus:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete syllabus
router.delete('/:id', auth, async (req, res) => {
    try {
        const syllabus = await Syllabus.findOneAndDelete({
            _id: req.params.id,
            facultyId: req.user.id
        });

        if (!syllabus) {
            return res.status(404).json({ message: 'Syllabus not found' });
        }

        res.json({ message: 'Syllabus deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
