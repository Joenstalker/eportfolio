const express = require('express');
const router = express.Router();
const Profile = require('../models/ProfileDashboard');
const auth = require('../middleware/auth');

// Get profile
router.get('/', auth, async (req, res) => {
    try {
        let profile = await Profile.findOne({ facultyId: req.user.id })
            .populate('facultyId', 'firstName lastName email department position');

        if (!profile) {
            profile = new Profile({
                facultyId: req.user.id,
                personalInfo: {
                    fullName: req.user.name,
                    email: req.user.email,
                    department: req.user.department
                },
                teachingLoad: {
                    currentLoad: 0,
                    maxLoad: 5
                },
                quickLinks: []
            });
            await profile.save();
        }

        res.json(profile);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update profile
router.put('/', auth, async (req, res) => {
    try {
        const { personalInfo } = req.body;
        await Profile.findOneAndUpdate(
            { facultyId: req.user.id },
            { personalInfo },
            { new: true, upsert: true }
        );
        
        // Fetch the updated profile with populated faculty info
        const updatedProfile = await Profile.findOne({ facultyId: req.user.id })
            .populate('facultyId', 'firstName lastName email department position');
        
        res.json({ message: 'Profile updated successfully', profile: updatedProfile });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;