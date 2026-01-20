const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const router = express.Router();

// Debug: confirm auth router loaded
console.log('Auth routes module loaded');

// Simple ping to verify router is mounted
router.get('/ping', (req, res) => {
    res.json({ ok: true, message: 'Auth router reachable' });
});

// Google OAuth client with proper configuration
const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.API_BASE_URL}/api/auth/google/callback`
);

// reCAPTCHA verification removed

// Email service placeholder
const sendResetCodeEmail = async (email, resetCode) => {
    try {
        console.log(`Password reset code for ${email}: ${resetCode}`);
        console.log(`In production, implement email service here`);
        return true;
    } catch (error) {
        console.error('Email sending error:', error);
        throw new Error('Failed to send reset code email');
    }
};

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, role, department } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !password || !role || !department) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Normalize inputs and constrain role
        const normalizedEmail = String(email).toLowerCase().trim();
        const normalizedRole = String(role).toLowerCase() === 'admin' ? 'admin' : (String(role).toLowerCase() === 'staff' ? 'staff' : 'faculty');

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user (allow duplicate emails)
        const user = new User({
            firstName: String(firstName).trim(),
            lastName: String(lastName).trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: normalizedRole,
            department: String(department).trim()
        });

        await user.save();

        res.status(201).json({ 
            message: 'User created successfully',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                department: user.department
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error?.code === 11000) {
            return res.status(409).json({ message: 'A database unique index blocked creating this user. Remove unique index on email to allow duplicates.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Setup demo users (DEV only) - idempotent
router.post('/setup-demo', async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ message: 'Demo setup is disabled in production' });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'Missing JWT_SECRET in server environment' });
        }

        const demoUsers = [
            {
                firstName: 'Test',
                lastName: 'Admin',
                email: 'admin@gmail.com',
                role: 'admin',
                department: 'IT',
                password: 'Admin@1234'
            },
            {
                firstName: 'Test',
                lastName: 'Faculty',
                email: 'faculty@gmail.com',
                role: 'faculty',
                department: 'Computer Science',
                password: 'Test@1234'
            }
        ];

        const results = [];

        for (const u of demoUsers) {
            const normalizedEmail = String(u.email).toLowerCase().trim();
            let user = await User.findOne({ email: normalizedEmail });

            // Always ensure password is set to known value in dev demo seeding
            const hashedPassword = await bcrypt.hash(u.password, 12);

            if (!user) {
                user = new User({
                    firstName: u.firstName,
                    lastName: u.lastName,
                    email: normalizedEmail,
                    password: hashedPassword,
                    role: u.role,
                    department: u.department
                });
                await user.save();
                results.push({ email: normalizedEmail, action: 'created', role: u.role });
            } else {
                user.firstName = u.firstName;
                user.lastName = u.lastName;
                user.role = u.role;
                user.department = u.department;
                user.password = hashedPassword;
                await user.save();
                results.push({ email: normalizedEmail, action: 'updated', role: u.role });
            }
        }

        return res.json({
            success: true,
            message: 'Demo users ready',
            users: results
        });
    } catch (error) {
        console.error('Demo setup error:', error);
        return res.status(500).json({ message: 'Server error during demo setup' });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = String(email || '').toLowerCase().trim();

        // Find user
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: `${user.firstName} ${user.lastName}`,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                department: user.department
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const normalizedEmail = String(email || '').toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate reset code (6-digit number)
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordCode = resetCode;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        // Send email with reset code
        await sendResetCodeEmail(normalizedEmail, resetCode);

        res.json({ message: 'Reset code sent to your email' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        const normalizedEmail = String(email || '').toLowerCase().trim();

        const user = await User.findOne({ 
            email: normalizedEmail, 
            resetPasswordCode: code,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset code' });
        }

        // Hash new password
        user.password = await bcrypt.hash(newPassword, 12);
        user.resetPasswordCode = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
});

// Google OAuth endpoint
router.get('/google', (req, res) => {
    const url = googleClient.generateAuthUrl({
        access_type: 'offline',
        scope: ['profile', 'email'],
        redirect_uri: `${process.env.API_BASE_URL}/api/auth/google/callback`,
        include_granted_scopes: true
    });
    console.log('Generated Google auth URL:', url);
    // Helpful debug: log redirect_uri param explicitly
    try {
        const parsed = new URL(url);
        console.log('Google redirect_uri param =', parsed.searchParams.get('redirect_uri'));
    } catch (e) {
        // ignore
    }
    res.redirect(url);
});

// Google OAuth callback
router.get('/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
        }

        const { tokens } = await googleClient.getToken({
            code,
            redirect_uri: `${process.env.API_BASE_URL}/api/auth/google/callback`
        });
        
        const ticket = await googleClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        // Find existing user by googleId or email
        let user = await User.findOne({ googleId: payload.sub });
        if (!user) {
            user = await User.findOne({ email });
        }

        if (user) {
            // Generate JWT token and redirect to frontend
            const token = jwt.sign(
                { id: user._id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
        }

        // No existing user: redirect to frontend choose page so the user can select desired role
        // Pass minimal info via query params (email, name, sub as googleId) - these are URL-encoded
        const chooseUrl = new URL(`${process.env.FRONTEND_URL}/auth/choose`);
        chooseUrl.searchParams.set('email', email);
        chooseUrl.searchParams.set('name', name);
        chooseUrl.searchParams.set('googleId', payload.sub);
        return res.redirect(chooseUrl.toString());
    } catch (error) {
        console.error('Google OAuth callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        res.json({
            user: {
                id: user._id,
                name: `${user.firstName} ${user.lastName}`,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                department: user.department
            }
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Complete Google sign-in for users who chose a role on the frontend
router.post('/google/complete', async (req, res) => {
    try {
        const { googleId, email, name, role } = req.body;

        if (!googleId || !email || !role) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check again if user exists
        let user = await User.findOne({ $or: [{ googleId }, { email }] });
        if (user) {
            // If exists, link googleId if missing
            if (!user.googleId) {
                user.googleId = googleId;
                user.loginMethod = 'google';
                await user.save();
            }
        } else {
            // Create new user with chosen role
            const [firstName, ...ln] = (name || '').split(' ');
            user = new User({
                googleId,
                firstName: firstName || 'User',
                lastName: ln.join(' ') || '',
                email,
                password: await bcrypt.hash(Math.random().toString(36) + Date.now().toString(), 12),
                role: role === 'admin' ? 'admin' : 'faculty',
                department: 'General',
                loginMethod: 'google',
                isVerified: true
            });
            await user.save();
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
        }});
    } catch (error) {
        console.error('Error completing Google sign-in:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;