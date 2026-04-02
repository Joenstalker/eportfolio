const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const auth = (req, res, next) => {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Handle both "Bearer token" and just "token" formats
    const token = authHeader.startsWith('Bearer ') 
        ? authHeader.replace('Bearer ', '')
        : authHeader;

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
        console.log('🔑 JWT Secret source:', process.env.JWT_SECRET ? 'Environment' : 'Fallback');
        console.log('🔑 JWT Secret length:', jwtSecret.length);
        
        if (!jwtSecret) {
            console.error('JWT_SECRET is not set in environment and no fallback available');
            return res.status(500).json({ message: 'Server misconfiguration: missing JWT secret' });
        }

        const decoded = jwt.verify(token, jwtSecret);
        const userId = decoded?.id || decoded?._id;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            console.error('❌ Token payload missing a valid user id');
            return res.status(401).json({ message: 'Token is not valid' });
        }

        decoded.id = String(userId);
        console.log('✅ Token verified successfully for user ID:', decoded.id);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('❌ Token verification error:', error.message);
        console.error('❌ Token provided:', token.substring(0, 50) + '...');
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;
