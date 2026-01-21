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

        // Normalize inputs
        const normalizedEmail = String(email).toLowerCase().trim();
        /**
         * IMPORTANT RBAC RULE:
         * - Public self‑registration can ONLY create faculty accounts.
         * - Admins can later promote a faculty to admin via the admin user‑management endpoints.
         * - We therefore ignore any "role" coming from the client here and force "faculty".
         */
        const normalizedRole = 'faculty';

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

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = String(email || '').toLowerCase().trim();

        // Find user(s). This codebase previously allowed duplicate emails.
        // We must select the record whose password matches, then prefer admin among matches.
        const candidates = await User.find({ email: normalizedEmail }).limit(20);
        if (!candidates || candidates.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const passwordMatches = [];
        for (const candidate of candidates) {
            const ok = await bcrypt.compare(password, candidate.password);
            if (ok) passwordMatches.push(candidate);
        }

        if (passwordMatches.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = passwordMatches.find(u => (u.role || '').toString().toLowerCase() === 'admin') || passwordMatches[0];

        // Block archived / inactive accounts from logging in
        if (user.isActive === false) {
            return res.status(403).json({ message: 'Your account is archived/inactive. Please contact the system administrator.' });
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