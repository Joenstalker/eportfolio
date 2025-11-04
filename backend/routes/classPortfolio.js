import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import ClassPortfolio from '../models/ClassPortfolio.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/class-materials/'));
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg',
            'image/png',
            'text/plain'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Allowed: PDF, Word, PowerPoint, Images, Text'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// GET /api/class-portfolio - Get all class portfolios
router.get('/', auth, async (req, res) => {
    try {
        console.log('📦 Fetching class portfolio for user:', req.user._id);
        const classPortfolios = await ClassPortfolio.find({ facultyId: req.user._id });
        console.log('✅ Found class portfolios:', classPortfolios.length);
        res.json(classPortfolios);
    } catch (error) {
        console.error('❌ Error fetching class portfolio:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/class-portfolio/materials - Add new material
router.post('/materials', auth, upload.single('materialFile'), async (req, res) => {
    try {
        console.log('📤 Received material upload request');
        console.log('📝 Form data:', req.body);
        console.log('📁 File:', req.file);

        const { title, subject, type, description, section, topic, isPublic } = req.body;
        
        if (!title || !subject) {
            return res.status(400).json({ message: 'Title and subject are required' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'File is required' });
        }

        // Find or create class portfolio for this subject
        let classPortfolio = await ClassPortfolio.findOne({ 
            facultyId: req.user._id, 
            subjectCode: subject 
        });

        if (!classPortfolio) {
            classPortfolio = new ClassPortfolio({
                facultyId: req.user._id,
                subjectCode: subject,
                subjectName: subject, // Using subject as name for now
                materials: []
            });
        }

        const newMaterial = {
            title,
            description: description || '',
            fileUrl: `/uploads/class-materials/${req.file.filename}`,
            fileType: req.file.mimetype,
            section: section || '',
            topic: topic || '',
            isPublic: isPublic === 'true',
            uploadDate: new Date()
        };

        classPortfolio.materials.push(newMaterial);
        await classPortfolio.save();

        console.log('✅ Material added successfully:', newMaterial.title);

        res.status(201).json({
            message: 'Material added successfully',
            material: newMaterial,
            classPortfolio
        });

    } catch (error) {
        console.error('❌ Error adding material:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// DELETE /api/class-portfolio/materials/:materialId - Delete material
router.delete('/materials/:materialId', auth, async (req, res) => {
    try {
        const classPortfolio = await ClassPortfolio.findOne({ 
            facultyId: req.user._id,
            'materials._id': req.params.materialId 
        });
        
        if (!classPortfolio) {
            return res.status(404).json({ message: 'Material not found' });
        }

        classPortfolio.materials.pull({ _id: req.params.materialId });
        await classPortfolio.save();

        res.json({ message: 'Material deleted successfully' });
    } catch (error) {
        console.error('Error deleting material:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;