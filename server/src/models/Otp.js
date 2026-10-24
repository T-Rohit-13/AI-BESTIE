import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['REGISTRATION', 'PASSWORD_RESET'],
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 3,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes TTL
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Otp || mongoose.model('Otp', OtpSchema);
