const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class GoogleAuthService {
  // Verify Google ID token
  static async verifyGoogleToken(idToken) {
    try {
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      
      return ticket.getPayload();
    } catch (error) {
      throw new Error('Invalid Google token: ' + error.message);
    }
  }

  // Find or create user from Google payload
  static async findOrCreateUser(googlePayload) {
    try {
      // Check if user exists by googleId
      let user = await User.findOne({ googleId: googlePayload.sub });
      
      if (user) {
        user.lastLogin = new Date();
        await user.save();
        return user;
      }

      // Check if user exists by email (for existing users who want to link Google)
      user = await User.findOne({ email: googlePayload.email });
      
      if (user) {
        // Link Google account to existing user
        user.googleId = googlePayload.sub;
        user.avatar = googlePayload.picture;
        user.loginMethod = 'google';
        user.lastLogin = new Date();
        await user.save();
        return user;
      }

      // Create new user
      user = await User.create({
        googleId: googlePayload.sub,
        name: googlePayload.name,
        email: googlePayload.email,
        avatar: googlePayload.picture,
        role: 'faculty',
        department: 'To be updated',
        loginMethod: 'google',
        isVerified: googlePayload.email_verified || false,
        lastLogin: new Date()
      });

      return user;
    } catch (error) {
      throw new Error('Error finding/creating user: ' + error.message);
    }
  }

  // Generate JWT token for user
  static generateToken(user) {
    return jwt.sign(
      { 
        id: user._id,
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  // Get user data for response (exclude sensitive info)
  static getUserData(user) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      avatar: user.avatar,
      loginMethod: user.loginMethod,
      isVerified: user.isVerified,
      lastLogin: user.lastLogin
    };
  }
}

module.exports = GoogleAuthService;