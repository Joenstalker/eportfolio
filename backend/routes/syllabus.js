const express = require('express');
const router = express.Router();
const Syllabus = require('../models/Syllabus');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

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

// Upload syllabus with file
router.post('/', auth, upload.single('syllabusFile'), async (req, res) => {
    try {
        const { subjectCode, subjectName, section, semester, version } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ message: 'Please select a syllabus file' });
        }

        const syllabus = new Syllabus({
            facultyId: req.user.id,
            subjectCode,
            subjectName,
            section,
            semester,
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
        
        console.log('Syllabus uploaded successfully:', syllabus);
        res.json({ 
            message: 'Syllabus uploaded successfully', 
            syllabus 
        });

    } catch (error) {
        console.error('Error uploading syllabus:', error);
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