const express = require('express');
const router = express.Router();
const InstructionalMaterial = require('../models/InstructionalMaterial');
const auth = require('../middleware/auth');
const { instructionalUpload } = require('../middleware/upload');

const instructionalFileUpload = (req, res, next) => {
    instructionalUpload.single('file')(req, res, (error) => {
        if (error) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'Instructional material file must be 10MB or less.' });
            }
            return next(error);
        }

        next();
    });
};

// Get all materials
router.get('/', auth, async (req, res) => {
    try {
        console.log('GET /api/materials - auth user payload:', req.user);
        const userId = req.user?.id || req.user?._id || null;
        if (!userId) {
            console.warn('GET /api/materials - no user id in token payload', req.user);
            return res.status(400).json({ message: 'Invalid token payload: missing user id' });
        }

        const materials = await InstructionalMaterial.find({ facultyId: userId });
        res.json(materials);
    } catch (error) {
        console.error('Error fetching materials:', error?.message || error, error?.stack || 'no-stack');
        res.status(500).json({ message: 'Server error', error: error?.message || String(error) });
    }
});

// Upload new material with file
router.post('/', auth, instructionalFileUpload, async (req, res) => {
    try {
        console.log('POST /api/materials - auth user payload:', req.user);
        const userId = req.user?.id || req.user?._id || null;
        if (!userId) {
            return res.status(400).json({ message: 'Invalid token payload: missing user id' });
        }

        const { subjectCode, subjectName, courseCode, title, description, type, section, topic, isPublic, tags } = req.body;

        const normalizedTitle = (title || '').trim();
        if (!normalizedTitle) {
            return res.status(400).json({ message: 'Title is required.' });
        }

        const normalizedType = ['lecture', 'assignment', 'quiz', 'exam', 'project', 'presentation', 'handout', 'video', 'other'].includes(type)
            ? type
            : 'lecture';

        const normalizedCourseCode = (courseCode || '').trim().toUpperCase();
        if (!normalizedCourseCode) {
            return res.status(400).json({ message: 'Course ID is required.' });
        }

        if (!/^[A-Z]{2,4}\d{3}$/.test(normalizedCourseCode)) {
            return res.status(400).json({ message: 'Course ID must follow format like IT131 or IT127.' });
        }

        const normalizedSubjectCode = (subjectCode || '').trim() || normalizedCourseCode;
        const normalizedSubjectName = (subjectName || '').trim();
        const normalizedDescription = (description || '').trim();
        const normalizedSection = (section || '').trim();
        const normalizedTopic = (topic || '').trim();
        const normalizedTags = typeof tags === 'string'
            ? tags.split(',').map(tag => tag.trim()).filter(Boolean)
            : Array.isArray(tags)
                ? tags.map(tag => String(tag).trim()).filter(Boolean)
                : [];
        
        if (!req.file) {
            return res.status(400).json({ message: 'Please select a file to upload' });
        }

        const material = new InstructionalMaterial({
            facultyId: userId,
            subjectCode: normalizedSubjectCode,
            courseCode: normalizedCourseCode,
            subjectName: normalizedSubjectName,
            title: normalizedTitle,
            description: normalizedDescription,
            type: normalizedType,
            section: normalizedSection,
            topic: normalizedTopic,
            isPublic: isPublic === 'true' || isPublic === true,
            tags: normalizedTags,
            file: {
                fileName: req.file.originalname,
                fileUrl: `/uploads/${req.file.filename}`,
                filePath: req.file.path,
                fileType: req.file.mimetype,
                fileSize: req.file.size
            }
        });

        await material.save();

        console.log('Material uploaded successfully:', { id: material._id, facultyId: material.facultyId });
        res.json({ 
            message: 'Material uploaded successfully', 
            material 
        });

    } catch (error) {
        console.error('Error uploading material:', error?.message || error, error?.stack || 'no-stack');
        if (error?.name === 'ValidationError' || error?.name === 'CastError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error', error: error?.message || String(error) });
    }
});

// Get materials by subject
router.get('/subject/:subjectCode', auth, async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id || null;
        if (!userId) {
            return res.status(400).json({ message: 'Invalid token payload: missing user id' });
        }

        const materials = await InstructionalMaterial.find({ 
            facultyId: userId,
            subjectCode: req.params.subjectCode 
        });
        res.json(materials);
    } catch (error) {
        console.error('Error fetching materials by subject:', error?.message || error, error?.stack || 'no-stack');
        res.status(500).json({ message: 'Server error', error: error?.message || String(error) });
    }
});

// Delete material
router.delete('/:id', auth, async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id || null;
        if (!userId) {
            return res.status(400).json({ message: 'Invalid token payload: missing user id' });
        }

        const material = await InstructionalMaterial.findOne({ 
            _id: req.params.id, 
            facultyId: userId 
        });

        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        // Delete physical file
        const fs = require('fs');
        if (material.file && material.file.filePath && fs.existsSync(material.file.filePath)) {
            fs.unlinkSync(material.file.filePath);
        }

        await InstructionalMaterial.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Material deleted successfully' });
    } catch (error) {
        console.error('Error deleting material:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;