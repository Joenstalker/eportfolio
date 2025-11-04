const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

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