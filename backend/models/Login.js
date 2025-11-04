import mongoose from 'mongoose';

const loginSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    enum: ['admin', 'faculty'],
    required: true
  },
  loginMethod: {
    type: String,
    enum: ['email', 'google'],
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  success: {
    type: Boolean,
    required: true
  },
  failureReason: {
    type: String
  },
  recaptchaVerified: {
    type: Boolean,
    default: false
  },
  deviceInfo: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for analytics
loginSchema.index({ userId: 1, createdAt: -1 });
loginSchema.index({ loginMethod: 1 });
loginSchema.index({ success: 1 });

export default mongoose.model('Login', loginSchema);