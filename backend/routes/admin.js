const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const InstructionalMaterial = require('../models/InstructionalMaterial');
const Syllabus = require('../models/Syllabus');
const SeminarCertificate = require('../models/SeminarCertificate');
const ClassPortfolio = require('../models/ClassPortfolio');
const Research = require('../models/Research');

// NEW: Get all users (admin only)
router.get('/users', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const users = await User.find({}, '-password').lean(); // Exclude passwords
        const mapped = [];
        for (const u of users) {
            const safeFirst = u.firstName || u.name || '';
            const safeLast = u.lastName || '';
            mapped.push({
                _id: u._id,
                name: `${safeFirst} ${safeLast}`.trim() || 'User',
                email: u.email || '',
                department: u.department || '',
                role: u.role || 'faculty',
                status: u.isActive === false ? 'inactive' : 'active'
            });
        }
        res.json(mapped);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// NEW: Create new faculty (admin only)
router.post('/users', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const { name, firstName, lastName, email, password, department, role, position } = req.body;

        // Basic validation
        const normalizedEmail = (email || '').toLowerCase().trim();
        const normalizedDept = (department || '').trim();
        const normalizedRole = (role || '').toString().toLowerCase() === 'admin' ? 'admin' : 'faculty';
        if (!normalizedEmail || !password || !normalizedDept || (!firstName && !name)) {
            return res.status(400).json({ message: 'Missing required fields (name, email, password, department)' });
        }

        // Allow duplicate emails: do not block creation

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const [fn, ...lnParts] = (name || '').trim().split(' ');
        const newUser = new User({
            firstName: firstName || fn || 'New',
            lastName: lastName || lnParts.join(' ') || 'User',
            email: normalizedEmail,
            password: hashedPassword,
            department: normalizedDept,
            role: normalizedRole,
            isActive: true
        });

        await newUser.save();

        res.status(201).json({ 
            message: 'User created successfully',
            user: {
                _id: newUser._id,
                name: `${newUser.firstName} ${newUser.lastName}`.trim(),
                email: newUser.email,
                department: newUser.department,
                role: newUser.role,
                status: newUser.isActive ? 'active' : 'inactive'
            }
        });

    } catch (error) {
        console.error('Error creating user:', error);
        if (error?.code === 11000) {
            const dupField = Object.keys(error.keyPattern || {})[0] || 'email';
            const dupValue = (error.keyValue && error.keyValue[dupField]) || '';
            return res.status(409).json({ message: `${dupField} already in use`, field: dupField, value: dupValue });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// NEW: Update user (admin only)
router.put('/users/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const { name, firstName, lastName, email, department, role, position, status } = req.body;

        const update = {};
        if (email) update.email = email.toLowerCase().trim();
        if (department) update.department = department.trim();
        if (role) update.role = role.toString().toLowerCase() === 'admin' ? 'admin' : 'faculty';
        if (typeof status !== 'undefined') {
            update.isActive = status === 'active' || status === true;
        }
        if (name || firstName || lastName) {
            if (name && !firstName && !lastName) {
                const [fn, ...lnParts] = name.trim().split(' ');
                update.firstName = fn;
                update.lastName = lnParts.join(' ');
            } else {
                if (firstName) update.firstName = firstName;
                if (lastName) update.lastName = lastName;
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ 
            message: 'User updated successfully',
            user: {
                _id: updatedUser._id,
                name: `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
                email: updatedUser.email,
                department: updatedUser.department,
                role: updatedUser.role,
                status: updatedUser.isActive ? 'active' : 'inactive'
            }
        });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// NEW: Delete user (admin only)
router.delete('/users/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const deletedUser = await User.findByIdAndDelete(req.params.id);
        
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

// GET /api/admin/uploads - combined recent uploads across collections (admin only)
router.get('/uploads', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        // Fetch records from multiple collections and normalize
        const [materials, syllabi, seminars, classPortfolios, researches] = await Promise.all([
            InstructionalMaterial.find({}).populate('facultyId', 'firstName lastName').lean(),
            Syllabus.find({}).populate('facultyId', 'firstName lastName').lean(),
            SeminarCertificate.find({}).populate('facultyId', 'firstName lastName').lean(),
            ClassPortfolio.find({}).lean(),
            Research.find({}).populate('facultyId', 'firstName lastName').lean()
        ]);

        const uploads = [];

        materials.forEach(m => {
            if (m.file && (m.file.fileUrl || m.file.filePath || m.file.fileName)) {
                uploads.push({
                    source: 'InstructionalMaterial',
                    title: m.title || m.subjectName || m.file.fileName || 'Material',
                    fileName: m.file.fileName || null,
                    fileUrl: m.file.fileUrl || null,
                    uploadedAt: m.file.uploadedAt || m.createdAt || m.updatedAt || null,
                    faculty: m.facultyId ? `${m.facultyId.firstName || ''} ${m.facultyId.lastName || ''}`.trim() : null,
                    raw: m
                });
            }
        });

        syllabi.forEach(s => {
            if (s.syllabusFile && (s.syllabusFile.fileUrl || s.syllabusFile.filePath || s.syllabusFile.fileName)) {
                uploads.push({
                    source: 'Syllabus',
                    title: `${s.subjectCode || ''} ${s.subjectName || ''}`.trim() || s.syllabusFile.fileName || 'Syllabus',
                    fileName: s.syllabusFile.fileName || null,
                    fileUrl: s.syllabusFile.fileUrl || null,
                    uploadedAt: s.syllabusFile.uploadedAt || s.createdAt || s.updatedAt || null,
                    faculty: s.facultyId ? `${s.facultyId.firstName || ''} ${s.facultyId.lastName || ''}`.trim() : null,
                    raw: s
                });
            }
        });

        seminars.forEach(se => {
            if (se.certificateFile && (se.certificateFile.fileUrl || se.certificateFile.fileName)) {
                uploads.push({
                    source: 'SeminarCertificate',
                    title: se.title || se.certificateFile.fileName || 'Seminar',
                    fileName: se.certificateFile.fileName || null,
                    fileUrl: se.certificateFile.fileUrl || null,
                    uploadedAt: se.certificateFile.uploadedAt || se.createdAt || se.updatedAt || null,
                    faculty: se.facultyId ? `${se.facultyId.firstName || ''} ${se.facultyId.lastName || ''}`.trim() : null,
                    raw: se
                });
            }
        });

        // ClassPortfolio may store a top-level file or an array of materials
        classPortfolios.forEach(cp => {
            // array of materials (route pushes `materials` with uploadDate)
            if (Array.isArray(cp.materials) && cp.materials.length) {
                cp.materials.forEach(mat => {
                    if (mat.fileUrl || mat.filePath || mat.title) {
                        uploads.push({
                            source: 'ClassPortfolio',
                            title: mat.title || mat.fileName || 'Class Material',
                            fileName: mat.fileName || null,
                            fileUrl: mat.fileUrl || null,
                            uploadedAt: mat.uploadDate || mat.uploadedAt || cp.createdAt || null,
                            faculty: cp.faculty ? (cp.faculty.toString ? cp.faculty.toString() : null) : null,
                            raw: mat
                        });
                    }
                });
            }

            // top-level file
            if (cp.file && (cp.file.path || cp.file.filename || cp.file.originalName)) {
                uploads.push({
                    source: 'ClassPortfolio',
                    title: cp.title || cp.file.originalName || 'Class Material',
                    fileName: cp.file.originalName || cp.file.filename || null,
                    fileUrl: cp.file.path || null,
                    uploadedAt: cp.createdAt || null,
                    faculty: cp.faculty ? (cp.faculty.toString ? cp.faculty.toString() : null) : null,
                    raw: cp
                });
            }
        });

        researches.forEach(r => {
            if (r.file && (r.file.fileUrl || r.file.fileName)) {
                uploads.push({
                    source: 'Research',
                    title: r.title || r.file.fileName || 'Research Paper',
                    fileName: r.file.fileName || null,
                    fileUrl: r.file.fileUrl || null,
                    uploadedAt: r.file.uploadedAt || r.createdAt || r.updatedAt || null,
                    faculty: r.facultyId ? `${r.facultyId.firstName || ''} ${r.facultyId.lastName || ''}`.trim() : null,
                    raw: r
                });
            }
        });

        // Sort by uploadedAt (drop nulls at end) and limit
        const sorted = uploads
            .filter(u => u.uploadedAt)
            .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        // if some items have null uploadedAt, append them afterwards
        const withNulls = uploads.filter(u => !u.uploadedAt);

        const combined = [...sorted, ...withNulls].slice(0, 50);

        res.json({ uploads: combined });
    } catch (error) {
        console.error('Error fetching uploads:', error);
        res.status(500).json({ message: 'Server error' });
    }
});