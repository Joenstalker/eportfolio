const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const router = express.Router();
const Research = require('../models/Research');
const auth = require('../middleware/auth');
const { researchUpload } = require('../middleware/upload');

const allowedResearchFileExtensions = ['.pdf', '.doc', '.docx'];
const allowedResearchFileMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const doiUrlPattern = /^https:\/\/doi\.org\/10\.\d{4,9}\/[\w.()\-;/:]+$/i;

const getValidatedUserId = (req) => {
    const userId = req.user?.id || req.user?._id || null;

    if (!userId) {
        return { error: { status: 400, message: 'Invalid token payload: missing user id' } };
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return { error: { status: 400, message: 'Invalid token payload: invalid user id' } };
    }

    return { userId };
};

const researchFileUpload = (req, res, next) => {
    researchUpload.single('researchFile')(req, res, (error) => {
        if (error) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'Research file must be 10MB or less.' });
            }
            return next(error);
        }

        next();
    });
};

// Get all research
router.get('/', auth, async (req, res) => {
    try {
        const { userId, error } = getValidatedUserId(req);
        if (error) {
            return res.status(error.status).json({ message: error.message });
        }

        const research = await Research.find({ facultyId: userId });
        res.json(research);
    } catch (error) {
        console.error('Error fetching research:', error?.message || error, error?.stack || 'no-stack');
        res.status(500).json({ message: 'Server error' });
    }
});

// Add research (supports file upload)
router.post('/', auth, researchFileUpload, async (req, res) => {
    try {
        const { userId, error } = getValidatedUserId(req);
        if (error) {
            return res.status(error.status).json({ message: error.message });
        }

        const { title, abstract, authors, publicationDate, journal, doi, status, researchType } = req.body;
        const validationErrors = [];

        const normalizedTitle = typeof title === 'string' ? title.trim() : '';
        const normalizedAbstract = typeof abstract === 'string' ? abstract.trim() : '';
        const normalizedJournal = typeof journal === 'string' ? journal.trim() : '';
        const normalizedDoi = typeof doi === 'string' ? doi.trim() : '';
        const normalizedAuthors = Array.isArray(authors)
            ? authors.map(a => String(a || '').trim()).filter(Boolean)
            : (typeof authors === 'string'
                ? authors.split(',').map(a => a.trim()).filter(Boolean)
                : []);

        if (!normalizedTitle) {
            validationErrors.push('Title is required.');
        } else if (!/^[A-Za-z0-9][A-Za-z0-9 .,:;'"()\-/&]*$/.test(normalizedTitle)) {
            validationErrors.push('Title contains invalid characters.');
        } else {
            // Check for duplicate title for this faculty member
            const duplicateTitle = await Research.findOne({
                facultyId: userId,
                title: { $regex: `^${normalizedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
            });
            if (duplicateTitle) {
                validationErrors.push('A research paper with this title already exists.');
            }
        }

        if (normalizedAuthors.length === 0) {
            validationErrors.push('Author is required.');
        } else {
            const invalidAuthor = normalizedAuthors.find(author => !/^[A-Za-z][A-Za-z .\-']*$/.test(author));
            if (invalidAuthor) {
                validationErrors.push('Author name must contain letters only.');
            }
        }

        if (!normalizedAbstract) {
            validationErrors.push('Abstract field is required.');
        }

        if (!normalizedJournal) {
            validationErrors.push('Journal/Conference is required.');
        }

        if (normalizedDoi && !doiUrlPattern.test(normalizedDoi)) {
            validationErrors.push('DOI must be a valid DOI link (e.g., https://doi.org/10.1080/10509585.2015.1092083).');
        }

        let normalizedPublicationDate;

        if (publicationDate) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(publicationDate)) {
                validationErrors.push('Year must be a valid number.');
            }
            const parsedPublicationDate = new Date(publicationDate);
            
            if (Number.isNaN(parsedPublicationDate.getTime())) {
                return res.status(400).json({ message: 'Invalid publication date format.' });
            }

            const today = new Date();

            // Remove time portion for accurate comparison
            today.setHours(0,0,0,0);
            parsedPublicationDate.setHours(0,0,0,0);

            if (parsedPublicationDate > today) {
                return res.status(400).json({
                    message: 'Publication date cannot be in the future.'
                });
            }

            normalizedPublicationDate = parsedPublicationDate;
        }

        if (req.file) {
            const fileExtension = path.extname(req.file.originalname || '').toLowerCase();
            const mimeType = req.file.mimetype || '';
            const isAllowedExtension = allowedResearchFileExtensions.includes(fileExtension);
            const isAllowedMime = allowedResearchFileMimeTypes.includes(mimeType);

            if (!isAllowedExtension || !isAllowedMime) {
                return res.status(400).json({ message: 'Only PDF, DOC, and DOCX files are allowed.' });
            }
        }

        const normalizedStatus = ['draft', 'submitted', 'published', 'in-progress'].includes(status)
            ? status
            : 'published';

        const normalizedResearchType = [
            'journal-article',
            'conference-paper',
            'book-chapter',
            'review-paper',
            'patent',
            'other'
        ].includes(researchType)
            ? researchType
            : undefined;

        if (!normalizedResearchType) {
            validationErrors.push('Research type is required.');
        }

        if (['submitted', 'published'].includes(normalizedStatus) && !req.file) {
            validationErrors.push('A file upload is required when status is Submitted or Published.');
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                message: 'Validation failed.',
                errors: validationErrors
            });
        }

        const filePayload = req.file ? {
            fileName: req.file.originalname,
            fileUrl: `/uploads/${req.file.filename}`,
            fileType: req.file.mimetype,
            uploadedAt: new Date()
        } : undefined;
        
        const research = new Research({
            facultyId: userId,
            title: normalizedTitle,
            abstract: normalizedAbstract,
            authors: normalizedAuthors,
            publicationDate: normalizedPublicationDate,
            journal: normalizedJournal,
            doi: normalizedDoi,
            researchType: normalizedResearchType,
            status: normalizedStatus,
            file: filePayload
        });

        await research.save();
        res.json({ message: 'Research paper added successfully', researchPaper: research });
    } catch (error) {
        console.error('Error adding research:', error?.message || error, error?.stack || 'no-stack');
        if (error?.name === 'ValidationError' || error?.name === 'CastError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete research
router.delete('/:id', auth, async (req, res) => {
    try {
        const { userId, error } = getValidatedUserId(req);
        if (error) {
            return res.status(error.status).json({ message: error.message });
        }

        const research = await Research.findOneAndDelete({ 
            _id: req.params.id, 
            facultyId: userId 
        });
        
        if (!research) {
            return res.status(404).json({ message: 'Research paper not found' });
        }

        res.json({ message: 'Research paper deleted successfully' });
    } catch (error) {
        console.error('Error deleting research:', error?.message || error, error?.stack || 'no-stack');
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;