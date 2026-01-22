const crypto = require('crypto-js');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Set this in your .env file

if (!ENCRYPTION_KEY) {
    console.warn('WARNING: ENCRYPTION_KEY is not set in environment variables. Encryption will not work properly.');
}

class EncryptionUtil {
    /**
     * Encrypts a value using AES encryption
     * @param {string} value - The value to encrypt
     * @returns {string} - The encrypted value as a string, or the original value if encryption fails
     */
    static encrypt(value) {
        if (!ENCRYPTION_KEY) {
            console.warn('Encryption key not set, returning original value');
            return value;
        }

        try {
            if (typeof value !== 'string') {
                value = JSON.stringify(value);
            }
            return crypto.AES.encrypt(value, ENCRYPTION_KEY).toString();
        } catch (error) {
            console.error('Encryption error:', error.message);
            return value;
        }
    }

    /**
     * Decrypts a value using AES decryption
     * @param {string} encryptedValue - The encrypted value to decrypt
     * @returns {string|object} - The decrypted value, or the original value if decryption fails
     */
    static decrypt(encryptedValue) {
        if (!ENCRYPTION_KEY) {
            console.warn('Encryption key not set, returning original value');
            return encryptedValue;
        }

        try {
            const bytes = crypto.AES.decrypt(encryptedValue, ENCRYPTION_KEY);
            const decrypted = bytes.toString(crypto.enc.Utf8);
            
            // Try to parse as JSON, if it fails return as string
            try {
                return JSON.parse(decrypted);
            } catch {
                return decrypted;
            }
        } catch (error) {
            console.error('Decryption error:', error.message);
            return encryptedValue;
        }
    }

    /**
     * Hash a value using SHA-256
     * @param {string} value - The value to hash
     * @returns {string} - The hashed value
     */
    static hash(value) {
        if (!value) return value;
        
        try {
            return crypto.SHA256(value).toString();
        } catch (error) {
            console.error('Hash error:', error.message);
            return value;
        }
    }
}

module.exports = EncryptionUtil;