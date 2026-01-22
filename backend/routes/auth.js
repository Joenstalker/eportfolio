const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const User = require('../models/User');
const auth = require('../middleware/auth');
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

// Verify reCAPTCHA token
const verifyRecaptcha = async (token) => {
    if (!token) {
        return { success: false, message: 'Missing reCAPTCHA token' };
    }

    // Skip verification in development mode
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.log('🔧 Skipping reCAPTCHA verification in development/test mode');
        return { success: true };
    }

    try {
        console.log('🔍 Verifying reCAPTCHA token...');
        
        const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
            params: {
                secret: process.env.RECAPTCHA_SECRET_KEY,
                response: token
            }
        });

        console.log('📊 reCAPTCHA API Response:', response.data);

        const { success, 'error-codes': errorCodes } = response.data;
        
        if (!success) {
            const errorMessage = errorCodes ? errorCodes.join(', ') : 'reCAPTCHA verification failed';
            console.error('❌ reCAPTCHA verification failed:', errorMessage);
            return { success: false, message: `reCAPTCHA error: ${errorMessage}` };
        }

        console.log('✅ reCAPTCHA verification successful');
        return { success: true };
    } catch (error) {
        console.error('💥 reCAPTCHA verification error:', error.message);
        console.error('📋 Error details:', error.response?.data || error);
        return { success: false, message: `reCAPTCHA verification error: ${error.message}` };
    }
};

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password, recaptchaToken } = req.body;
        const normalizedEmail = String(email || '').toLowerCase().trim();

        // Verify reCAPTCHA token
        const recaptchaResult = await verifyRecaptcha(recaptchaToken);
        if (!recaptchaResult.success) {
            return res.status(400).json({ message: `reCAPTCHA error: ${recaptchaResult.message}` });
        }

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
        // Only allow sign-in if the user already exists in the database (added by admin)
        let user = await User.findOne({ googleId: payload.sub });
        if (!user) {
            user = await User.findOne({ email });
        }

        if (user) {
            // Check if user account is active
            if (user.isActive === false) {
                return res.redirect(`${process.env.FRONTEND_URL}/login?error=account_inactive`);
            }
            
            // User exists in the database (added by admin), allow sign-in
            // Link googleId if not already linked
            if (!user.googleId) {
                user.googleId = payload.sub;
                user.loginMethod = 'google';
                await user.save();
            }
            
            // Generate JWT token and redirect to frontend
            const token = jwt.sign(
                { id: user._id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
        }

        // User does not exist in the database (not added by admin), reject the sign-in
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=unauthorized_email`);
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



// Update user's own profile information
router.put('/profile', auth, async (req, res) => {
    try {
        const { firstName, lastName, email, department, phone, office, bio } = req.body;
        
        // Find the user by the ID from the token
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Update user fields if provided
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email;
        if (department) user.department = department;
        if (phone) user.phone = phone;
        if (office) user.office = office;
        if (bio) user.bio = bio;
        
        await user.save();
        
        // Return user without password
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.json({
            message: 'Profile updated successfully',
            user: userResponse
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Server error during profile update' });
    }
});

module.exports = router;