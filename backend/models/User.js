const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { 
        type: String, 
        required: true,
        trim: true
    },
    lastName: { 
        type: String, 
        required: true,
        trim: true
    },
    email: { 
        type: String, 
        required: true, 
        lowercase: true,
        trim: true,
        index: true
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        required: true,
        enum: ['faculty', 'admin', 'staff'],
        default: 'faculty'
    },
    department: { 
        type: String, 
        required: true 
    },
    resetPasswordCode: String,
    resetPasswordExpires: Date,
    profilePicture: String,
    isActive: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true 
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Method to get user profile without sensitive data
userSchema.methods.toProfileJSON = function() {
    return {
        id: this._id,
        firstName: this.firstName,
        lastName: this.lastName,
        fullName: this.fullName,
        email: this.email,
        role: this.role,
        department: this.department,
        profilePicture: this.profilePicture,
        isActive: this.isActive,
        createdAt: this.createdAt
    };
};

// Optional non-unique index for faster lookups
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);