const express = require('express');
const router = express.Router();
const Research = require('../models/Research');
const auth = require('../middleware/auth');

// Get all research
router.get('/', auth, async (req, res) => {
    try {
        const research = await Research.find({ facultyId: req.user.id });
        res.json(research);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add research
router.post('/', auth, async (req, res) => {
    try {
        const { title, abstract, authors, publicationDate, journal, file } = req.body;
        
        const research = new Research({
            facultyId: req.user.id,
            title,
            abstract,
            authors,
            publicationDate,
            journal,
            file
        });

        await research.save();
        res.json({ message: 'Research paper added successfully', research });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;