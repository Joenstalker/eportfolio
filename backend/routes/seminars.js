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
        const { title, date, organizer, venue, duration, certificateTitle } = req.body;

        if (!title || !date || !organizer || !venue || !duration || !certificateTitle) {
            return res.status(400).json({
                message: 'Missing required fields: title, date, organizer, venue, duration, certificateTitle'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: 'Certificate file is required'
            });
        }

        const durationNumber = Number(duration);
        if (Number.isNaN(durationNumber) || durationNumber <= 0) {
            return res.status(400).json({
                message: 'Duration must be a positive number'
            });
        }
        
        const filePayload = {
            fileName: req.file.originalname,
            fileUrl: `/uploads/${req.file.filename}`,
            fileType: req.file.mimetype
        };
        
        const seminar = new SeminarCertificate({
            facultyId: req.user.id,
            title: title.trim(),
            date,
            organizer: organizer.trim(),
            venue: venue.trim(),
            duration: durationNumber,
            certificateTitle: certificateTitle.trim(),
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