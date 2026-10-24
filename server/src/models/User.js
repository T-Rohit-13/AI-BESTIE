import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [13, 'User must be at least 13 years old'],
      max: [120, 'Invalid age provided'],
    },
    personalMobile: {
      type: String,
      required: [true, 'Personal mobile number is required'],
      unique: true,
      trim: true,
      match: [/^[0-9]{10}$/, 'Mobile number must be a valid 10-digit number'],
      index: true,
    },
    isMobileVerified: {
      type: Boolean,
      default: false,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    trustedPersonMobile: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Trusted person mobile must be a valid 10-digit number'],
      default: null,
    },
    assignedHelpline: {
      name: { type: String, default: 'Tele-MANAS' },
      phone: { type: String, default: '14416' },
      region: { type: String, default: 'India / All States' },
    },
    location: {
      state: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: 'India' },
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
