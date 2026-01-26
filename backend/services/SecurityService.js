const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class SecurityService {
  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
  }

  // Generate a secure encryption key
  generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Encrypt sensitive data
  encrypt(data) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        'aes-256-cbc', 
        Buffer.from(this.encryptionKey, 'hex'), 
        iv
      );
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        iv: iv.toString('hex'),
        encryptedData: encrypted
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Encryption failed');
    }
  }

  // Decrypt sensitive data
  decrypt(encryptedObject) {
    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(this.encryptionKey, 'hex'),
        Buffer.from(encryptedObject.iv, 'hex')
      );
      
      let decrypted = decipher.update(encryptedObject.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Decryption failed');
    }
  }

  // Hash sensitive data (one-way)
  hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Generate secure tokens
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Rate limiting helper
  static createRateLimiter(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const attempts = new Map();
    
    return (identifier) => {
      const now = Date.now();
      const userAttempts = attempts.get(identifier) || [];
      
      // Remove expired attempts
      const validAttempts = userAttempts.filter(time => now - time < windowMs);
      
      if (validAttempts.length >= maxAttempts) {
        return {
          allowed: false,
          resetTime: validAttempts[0] + windowMs
        };
      }
      
      validAttempts.push(now);
      attempts.set(identifier, validAttempts);
      
      return {
        allowed: true,
        remaining: maxAttempts - validAttempts.length
      };
    };
  }

  // Input sanitization
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
      .replace(/on\w+='[^']*'/gi, '') // Remove event handlers (single quotes)
      .replace(/on\w+=[^\s>]*/gi, ''); // Remove event handlers (no quotes)
  }

  // Validate and sanitize user input
  validateUserData(userData) {
    const sanitized = {};
    
    // Required fields
    if (userData.firstName) {
      sanitized.firstName = this.sanitizeInput(userData.firstName).substring(0, 50);
    }
    
    if (userData.lastName) {
      sanitized.lastName = this.sanitizeInput(userData.lastName).substring(0, 50);
    }
    
    if (userData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(userData.email)) {
        sanitized.email = userData.email.toLowerCase().substring(0, 100);
      }
    }
    
    // Optional fields
    if (userData.department) {
      sanitized.department = this.sanitizeInput(userData.department).substring(0, 100);
    }
    
    if (userData.position) {
      sanitized.position = this.sanitizeInput(userData.position).substring(0, 100);
    }
    
    if (userData.phone) {
      // Remove non-digit characters except + and spaces
      sanitized.phone = userData.phone.replace(/[^\d+\s]/g, '').substring(0, 20);
    }
    
    if (userData.office) {
      sanitized.office = this.sanitizeInput(userData.office).substring(0, 100);
    }
    
    return sanitized;
  }

  // Session security
  generateSessionToken() {
    return this.generateSecureToken(64);
  }

  // Password strength validation
  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const strength = {
      score: 0,
      feedback: []
    };
    
    if (password.length >= minLength) strength.score += 1;
    else strength.feedback.push(`Password must be at least ${minLength} characters long`);
    
    if (hasUpperCase) strength.score += 1;
    else strength.feedback.push('Password must contain at least one uppercase letter');
    
    if (hasLowerCase) strength.score += 1;
    else strength.feedback.push('Password must contain at least one lowercase letter');
    
    if (hasNumbers) strength.score += 1;
    else strength.feedback.push('Password must contain at least one number');
    
    if (hasSpecialChar) strength.score += 1;
    else strength.feedback.push('Password must contain at least one special character');
    
    strength.isStrong = strength.score === 5;
    
    return strength;
  }

  // Audit logging
  logSecurityEvent(eventType, userId, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      userId,
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown',
      details: details.additional || {}
    };
    
    // In production, send to security logging service
    console.log('SECURITY EVENT:', JSON.stringify(logEntry));
    
    return logEntry;
  }

  // CSRF protection token generation
  generateCSRFToken() {
    return this.generateSecureToken(32);
  }

  // Verify CSRF token
  verifyCSRFToken(token, expectedToken) {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(expectedToken)
    );
  }
}

module.exports = new SecurityService();