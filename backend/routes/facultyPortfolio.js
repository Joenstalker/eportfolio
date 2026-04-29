const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FacultyPortfolio = require('../models/FacultyPortfolio');
const auth = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/faculty-portfolio';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed'));
        }
    }
});

// Get faculty portfolio by faculty ID
router.get('/:facultyId', auth, async (req, res) => {
    try {
        let portfolio = await FacultyPortfolio.findOne({ facultyId: req.params.facultyId });
        if (!portfolio) {
            // Auto-create portfolio if it doesn't exist
            portfolio = new FacultyPortfolio({
                facultyId: req.params.facultyId,
                submittedForReview: false,
                adminReviewStatus: 'not_submitted',
                adminReviewMessage: '',
                missingDocuments: []
            });
            await portfolio.save();
        }
        res.json(portfolio);
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        res.status(500).json({ message: 'Error fetching portfolio', error: error.message });
    }
});

// Create or update faculty portfolio
router.post('/', auth, async (req, res) => {
    try {
        const { facultyId, portfolioData } = req.body;
        
        let portfolio = await FacultyPortfolio.findOne({ facultyId });
        
        if (portfolio) {
            // Update existing portfolio
            portfolio = await FacultyPortfolio.findOneAndUpdate(
                { facultyId },
                { $set: portfolioData },
                { new: true, runValidators: true }
            );
        } else {
            // Create new portfolio
            portfolio = new FacultyPortfolio({
                facultyId,
                ...portfolioData
            });
            await portfolio.save();
        }
        
        res.json(portfolio);
    } catch (error) {
        console.error('Error saving portfolio:', error);
        res.status(500).json({ message: 'Error saving portfolio', error: error.message });
    }
});

// Upload file for portfolio item
router.post('/upload/:facultyId', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        const { itemPath } = req.body; // Path to the item in the portfolio structure (e.g., "subjects.default.L1.instruction.1.CO1File")
        const fileUrl = `/uploads/faculty-portfolio/${req.file.filename}`;
        
        // Find and update the portfolio
        let portfolio = await FacultyPortfolio.findOne({ facultyId: req.params.facultyId });
        
        if (!portfolio) {
            return res.status(404).json({ message: 'Portfolio not found' });
        }
        
        // Parse the itemPath and update the nested structure
        const pathParts = itemPath.split('.');
        let current = portfolio;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
            current = current[pathParts[i]];
        }
        
        const lastPart = pathParts[pathParts.length - 1];
        if (current && current[lastPart] !== undefined) {
            if (typeof current[lastPart] === 'object' && !Array.isArray(current[lastPart])) {
                current[lastPart].uploaded = true;
                current[lastPart].fileName = req.file.originalname;
                current[lastPart].fileUrl = fileUrl;
            }
        }
        
        await portfolio.save();
        
        res.json({ 
            message: 'File uploaded successfully', 
            fileUrl,
            fileName: req.file.originalname 
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ message: 'Error uploading file', error: error.message });
    }
});

// Remove file from portfolio item
router.delete('/file/:facultyId', auth, async (req, res) => {
    try {
        const { itemPath } = req.body;
        
        let portfolio = await FacultyPortfolio.findOne({ facultyId: req.params.facultyId });
        
        if (!portfolio) {
            return res.status(404).json({ message: 'Portfolio not found' });
        }
        
        // Parse the itemPath and update the nested structure
        const pathParts = itemPath.split('.');
        let current = portfolio;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
            current = current[pathParts[i]];
        }
        
        const lastPart = pathParts[pathParts.length - 1];
        if (current && current[lastPart] !== undefined) {
            if (typeof current[lastPart] === 'object' && !Array.isArray(current[lastPart])) {
                // Delete the file from filesystem if it exists
                if (current[lastPart].fileUrl) {
                    const filePath = path.join(__dirname, '..', current[lastPart].fileUrl);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
                
                current[lastPart].uploaded = false;
                current[lastPart].fileName = '';
                current[lastPart].fileUrl = '';
            }
        }
        
        await portfolio.save();
        
        res.json({ message: 'File removed successfully' });
    } catch (error) {
        console.error('Error removing file:', error);
        res.status(500).json({ message: 'Error removing file', error: error.message });
    }
});

// Faculty submits portfolio for admin review
router.post('/:facultyId/submit', auth, async (req, res) => {
    try {
        const { facultyId } = req.params;

        // Allow faculty to submit their own portfolio, or admin to submit on behalf
        if (req.user.id !== facultyId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        let portfolio = await FacultyPortfolio.findOne({ facultyId });
        if (!portfolio) {
            // Auto-create portfolio if it doesn't exist
            portfolio = new FacultyPortfolio({
                facultyId,
                submittedForReview: true,
                submittedAt: new Date(),
                adminReviewStatus: 'pending',
                adminReviewMessage: '',
                missingDocuments: []
            });
            await portfolio.save();
            return res.json({ message: 'Portfolio created and submitted for review successfully', portfolio });
        }

        portfolio.submittedForReview = true;
        portfolio.submittedAt = new Date();
        portfolio.adminReviewStatus = 'pending';
        portfolio.adminReviewMessage = '';
        portfolio.missingDocuments = [];

        await portfolio.save();

        res.json({ message: 'Portfolio submitted for review successfully', portfolio });
    } catch (error) {
        console.error('Error submitting portfolio:', error);
        res.status(500).json({ message: 'Error submitting portfolio', error: error.message });
    }
});

// ==================== ADMIN REVIEW ENDPOINTS ====================

// Get all portfolios for admin review (with populated faculty info)
router.get('/admin/all', auth, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const portfolios = await FacultyPortfolio.find()
            .populate('facultyId', 'firstName lastName email department name')
            .populate('adminReviewedBy', 'firstName lastName email')
            .sort({ submittedAt: -1, updatedAt: -1 });

        res.json(portfolios);
    } catch (error) {
        console.error('Error fetching all portfolios:', error);
        res.status(500).json({ message: 'Error fetching portfolios', error: error.message });
    }
});

// Admin reviews/approves/rejects a portfolio
router.put('/admin/:facultyId/review', auth, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const { facultyId } = req.params;
        const { status, message, missingDocuments } = req.body;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Must be approved, rejected, or pending.' });
        }

        let portfolio = await FacultyPortfolio.findOne({ facultyId });
        if (!portfolio) {
            return res.status(404).json({ message: 'Portfolio not found' });
        }

        portfolio.adminReviewStatus = status;
        portfolio.adminReviewMessage = message || '';
        portfolio.adminReviewDate = new Date();
        portfolio.adminReviewedBy = req.user.id;
        portfolio.missingDocuments = Array.isArray(missingDocuments) ? missingDocuments : [];

        await portfolio.save();

        res.json({
            message: `Portfolio ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'updated'} successfully`,
            portfolio
        });
    } catch (error) {
        console.error('Error reviewing portfolio:', error);
        res.status(500).json({ message: 'Error reviewing portfolio', error: error.message });
    }
});

// Delete faculty portfolio
router.delete('/:facultyId', auth, async (req, res) => {
    try {
        const portfolio = await FacultyPortfolio.findOneAndDelete({ facultyId: req.params.facultyId });
        if (!portfolio) {
            return res.status(404).json({ message: 'Portfolio not found' });
        }
        res.json({ message: 'Portfolio deleted successfully' });
    } catch (error) {
        console.error('Error deleting portfolio:', error);
        res.status(500).json({ message: 'Error deleting portfolio', error: error.message });
    }
});

module.exports = router;
