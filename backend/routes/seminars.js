const express = require('express');
const router = express.Router();
const SeminarCertificate = require('../models/SeminarCertificate');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get all seminars
router.get('/', auth, async (req, res) => {
    try {
        const seminars = await SeminarCertificate.find({ facultyId: req.user.id });
        res.json(seminars);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add seminar
router.post('/', auth, upload.single('certificate'), async (req, res) => {
    try {
        const { title, date, organizer } = req.body;
        
        const filePayload = req.file ? {
            fileName: req.file.originalname,
            fileUrl: `/uploads/${req.file.filename}`,
            fileType: req.file.mimetype
        } : undefined;
        
        const seminar = new SeminarCertificate({
            facultyId: req.user.id,
            title,
            date,
            organizer,
            certificateFile: filePayload
        });

        await seminar.save();
        res.json({ message: 'Seminar added successfully', seminar });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete seminar
router.delete('/:id', auth, async (req, res) => {
    try {
        const seminar = await SeminarCertificate.findOneAndDelete({ 
            _id: req.params.id, 
            facultyId: req.user.id 
        });
        
        if (!seminar) {
            return res.status(404).json({ message: 'Seminar not found' });
        }

        res.json({ message: 'Seminar deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;