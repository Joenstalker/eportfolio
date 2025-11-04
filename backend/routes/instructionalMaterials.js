const express = require('express');
const router = express.Router();
const InstructionalMaterial = require('../models/InstructionalMaterial');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get all materials
router.get('/', auth, async (req, res) => {
    try {
        const materials = await InstructionalMaterial.find({ facultyId: req.user.id });
        res.json(materials);
    } catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload new material with file
router.post('/', auth, upload.single('file'), async (req, res) => {
    try {
        const { subjectCode, subjectName, title, description, type, section, topic, isPublic } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ message: 'Please select a file to upload' });
        }

        const material = new InstructionalMaterial({
            facultyId: req.user.id,
            subjectCode,
            subjectName,
            title,
            description,
            type,
            section,
            topic,
            isPublic: isPublic === 'true',
            file: {
                fileName: req.file.originalname,
                fileUrl: `/uploads/${req.file.filename}`,
                filePath: req.file.path,
                fileType: req.file.mimetype,
                fileSize: req.file.size
            }
        });

        await material.save();
        
        console.log('Material uploaded successfully:', material);
        res.json({ 
            message: 'Material uploaded successfully', 
            material 
        });

    } catch (error) {
        console.error('Error uploading material:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get materials by subject
router.get('/subject/:subjectCode', auth, async (req, res) => {
    try {
        const materials = await InstructionalMaterial.find({ 
            facultyId: req.user.id,
            subjectCode: req.params.subjectCode 
        });
        res.json(materials);
    } catch (error) {
        console.error('Error fetching materials by subject:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete material
router.delete('/:id', auth, async (req, res) => {
    try {
        const material = await InstructionalMaterial.findOne({ 
            _id: req.params.id, 
            facultyId: req.user.id 
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