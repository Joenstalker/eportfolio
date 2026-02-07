const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

const User = require('../models/User');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.API_BASE_URL}/api/auth/google/callback`
);

const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, department, role: userRole } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password, // Will be hashed by pre-save hook
      department,
      position: 'Faculty', // Default position
      role: userRole || 'faculty'
    });
    
    await user.save();

    // Generate token
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'fallback_secret', {
      expiresIn: '7d',
    });

    res.status(201).json({
      token,
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
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(' Login attempt for email:', email);

    // Find user by email
    const user = await User.findOne({ email });
    console.log(' User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log(' User details:', { id: user._id, email: user.email, role: user.role });
    }
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    console.log(' Comparing passwords...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(' Password match:', isMatch ? 'Yes' : 'No');
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'fallback_secret', {
      expiresIn: '7d',
    });
    console.log(' Token generated successfully');

    res.json({
      token,
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
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Google OAuth callback
router.post('/google/callback', async (req, res) => {
  try {
    const { email, name, firstName, lastName, picture } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // Update profile picture if provided
      if (picture) {
        user.profilePicture = picture;
        await user.save();
      }
    } else {
      // Create new user
      const nameParts = name ? name.split(' ') : [];
      const newFirstName = firstName || nameParts[0] || 'Unknown';
      const newLastName = lastName || nameParts.slice(1).join(' ') || 'User';

      user = new User({
        firstName: newFirstName,
        lastName: newLastName,
        email,
        password: crypto.randomBytes(20).toString('hex'), // Random password for OAuth users
        role: 'faculty', // Default role for new users
        position: 'Faculty', // Default position for new users
        department: 'General' // Default department for new users
      });
      
      await user.save();
    }

    // Generate token
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'fallback_secret', {
      expiresIn: '7d',
    });

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user found with that email' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Set reset token and expiry on user
    user.resetPasswordCode = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // In a real application, send email with reset link
    console.log(`Reset token for ${email}: ${resetToken}`); // For testing purposes

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordCode: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user password and clear reset fields
    user.password = hashedPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
        phone: user.phone,
        office: user.office,
        bio: user.bio,
        profilePicture: user.profilePicture,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user's own profile information
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, email, department, position, phone, office, bio } = req.body;
    
    console.log('Received profile update request:', { firstName, lastName, email, department, position, phone, office, bio });
    
    // Find the user by the ID from the token
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('Original user data:', {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      department: user.department,
      position: user.position,
      phone: user.phone,
      office: user.office,
      bio: user.bio
    });
    
    // Update user fields if provided
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (department) user.department = department;
    if (position) user.position = position;
    if (phone) user.phone = phone;
    if (office) user.office = office;
    if (bio) user.bio = bio;
    
    await user.save();
    
    console.log('Updated user data:', {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      department: user.department,
      position: user.position,
      phone: user.phone,
      office: user.office,
      bio: user.bio
    });
    
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: userResponse._id,
        firstName: userResponse.firstName,
        lastName: userResponse.lastName,
        email: userResponse.email,
        role: userResponse.role,
        department: userResponse.department,
        position: userResponse.position,
        phone: userResponse.phone,
        office: userResponse.office,
        bio: userResponse.bio,
        profilePicture: userResponse.profilePicture,
        isActive: userResponse.isActive
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error during profile update' });
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
  res.redirect(url);
});

// Google OAuth callback
router.get('/google/callback', async (req, res) => {
  try {
    console.log('Google OAuth callback initiated');
    const { code } = req.query;
    
    if (!code) {
      console.log('No code provided in callback');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }

    console.log('Exchanging code for tokens...');
    const { tokens } = await googleClient.getToken({
      code,
      redirect_uri: `${process.env.API_BASE_URL}/api/auth/google/callback`
    });
    
    console.log('Verifying ID token...');
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;
    console.log('User verified:', email);

    // Find existing user by googleId or email
    console.log('Searching for existing user...');
    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = await User.findOne({ email });
    }

    if (user) {
      console.log('Existing user found, generating token');
      // Update profile picture if provided
      if (picture && user.profilePicture !== picture) {
        user.profilePicture = picture;
        await user.save();
      }
      
      // Generate JWT token and redirect to frontend
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      console.log('Redirecting to auth callback with token');
      return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    }

    console.log('New user, redirecting to role selection');
    // No existing user: redirect to frontend choose page so the user can select desired role
    const chooseUrl = new URL(`${process.env.FRONTEND_URL}/auth/choose`);
    chooseUrl.searchParams.set('email', email);
    chooseUrl.searchParams.set('name', name);
    chooseUrl.searchParams.set('googleId', payload.sub);
    console.log('Redirecting to choose role page');
    return res.redirect(chooseUrl.toString());
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    console.error('Error details:', error.message, error.code, error.status);
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
