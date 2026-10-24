// INARO — OTP Verification Mongoose Schema (Team Member 1 Scope)
// Implements 5-minute TTL via MongoDB TTL index, max-3-attempt lockout,
// and bcrypt-hashed OTP storage for security.
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    mobile: {
      type:     String,
      required: [true, 'Mobile number is required for OTP'],
      index:    true,
    },
    otpHash: {
      type:     String,
      required: true,
    },
    purpose: {
      type:     String,
      required: true,
      enum: {
        values:  ['REGISTRATION', 'PASSWORD_RESET'],
        message: 'Purpose must be REGISTRATION or PASSWORD_RESET',
      },
    },
    attempts: {
      type:    Number,
      default: 0,
      max:     [3, 'Maximum OTP attempts exceeded'],
    },
    expiresAt: {
      type:    Date,
      default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      index:   { expireAfterSeconds: 0 },                   // MongoDB TTL index
    },
    isConsumed: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index to efficiently query OTPs by mobile + purpose
otpSchema.index({ mobile: 1, purpose: 1 });

module.exports = mongoose.model('Otp', otpSchema);
