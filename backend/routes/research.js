const express = require('express');
const router = express.Router();
const Research = require('../models/Research');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

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

// Add research (supports file upload)
router.post('/', auth, upload.single('researchFile'), async (req, res) => {
    try {
        const { title, abstract, authors, publicationDate, journal } = req.body;

        const filePayload = req.file ? {
            fileName: req.file.originalname,
            fileUrl: `/uploads/${req.file.filename}`,
            fileType: req.file.mimetype,
            uploadedAt: new Date()
        } : undefined;
        
        const research = new Research({
            facultyId: req.user.id,
            title,
            abstract,
            authors: authors ? (Array.isArray(authors) ? authors : (typeof authors === 'string' ? authors.split(',').map(a => a.trim()) : [])) : [],
            publicationDate: publicationDate || undefined,
            journal,
            file: filePayload
        });

        await research.save();
        res.json({ message: 'Research paper added successfully', researchPaper: research });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete research
router.delete('/:id', auth, async (req, res) => {
    try {
        const research = await Research.findOneAndDelete({ 
            _id: req.params.id, 
            facultyId: req.user.id 
        });
        
        if (!research) {
            return res.status(404).json({ message: 'Research paper not found' });
        }

        res.json({ message: 'Research paper deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;