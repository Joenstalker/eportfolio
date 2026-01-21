const express = require('express');
const router = express.Router();
const Extension = require('../models/Extension');

// Get all extension activities for the logged-in user
router.get('/', async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Unauthorized: No user ID provided' });
        }

        const userId = req.user.id;
        const extensions = await Extension.find({ userId: userId });
        
        res.json(extensions);
    } catch (error) {
        console.error('Error fetching extension activities:', error);
        res.status(500).json({ message: 'Server error while fetching extension activities' });
    }
});

// Add new extension activity
router.post('/', async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Unauthorized: No user ID provided' });
        }

        const userId = req.user.id;
        const extensionData = {
            ...req.body,
            userId: userId
        };

        const newExtension = new Extension(extensionData);
        const savedExtension = await newExtension.save();

        res.status(201).json({ 
            message: 'Extension activity added successfully',
            extension: savedExtension 
        });
    } catch (error) {
        console.error('Error adding extension activity:', error);
        res.status(500).json({ message: 'Server error while adding extension activity' });
    }
});

// Update extension activity
router.put('/:id', async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Unauthorized: No user ID provided' });
        }

        const extensionId = req.params.id;
        const userId = req.user.id;

        const updatedExtension = await Extension.findOneAndUpdate(
            { _id: extensionId, userId: userId },
            req.body,
            { new: true }
        );

        if (!updatedExtension) {
            return res.status(404).json({ message: 'Extension activity not found' });
        }

        res.json({ 
            message: 'Extension activity updated successfully',
            extension: updatedExtension 
        });
    } catch (error) {
        console.error('Error updating extension activity:', error);
        res.status(500).json({ message: 'Server error while updating extension activity' });
    }
});

// Delete extension activity
router.delete('/:id', async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Unauthorized: No user ID provided' });
        }

        const extensionId = req.params.id;
        const userId = req.user.id;

        const deletedExtension = await Extension.findOneAndDelete({
            _id: extensionId,
            userId: userId
        });

        if (!deletedExtension) {
            return res.status(404).json({ message: 'Extension activity not found' });
        }

        res.json({ message: 'Extension activity deleted successfully' });
    } catch (error) {
        console.error('Error deleting extension activity:', error);
        res.status(500).json({ message: 'Server error while deleting extension activity' });
    }
});

module.exports = router;