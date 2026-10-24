// INARO — User Mongoose Schema (Team Member 1 Scope)
// Contract-aligned with TEAM_OWNERSHIP.md and Prisma schema conventions
const mongoose = require('mongoose');

const assignedHelplineSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true },
    phone:  { type: String, required: true },
    region: { type: String, required: true },
  },
  { _id: false }
);

const locationSchema = new mongoose.Schema(
  {
    state:   { type: String, default: '' },
    country: { type: String, default: 'India' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // Core identity fields — aligned with Prisma model naming
    username: {
      type:      String,
      required:  [true, 'Username is required'],
      unique:    true,
      trim:      true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must not exceed 30 characters'],
      match:     [/^[a-z0-9_.-]+$/, 'Username may only contain lowercase letters, digits, underscores, dots, and hyphens'],
    },
    fullName: {
      type:     String,
      required: [true, 'Full name is required'],
      trim:     true,
    },
    age: {
      type:     Number,
      required: [true, 'Age is required'],
      min:      [13, 'You must be at least 13 years old to use INARO'],
    },
    mobileNumber: {
      type:     String,
      required: [true, 'Mobile number is required'],
      unique:   true,
      trim:     true,
    },
    isMobileVerified: {
      type:    Boolean,
      default: false,
    },
    passwordHash: {
      type:     String,
      required: [true, 'Password is required'],
    },
    // tokenVersion is incremented on password reset to invalidate old JWTs
    tokenVersion: {
      type:    Number,
      default: 0,
    },

    // Optional trusted contact (mobile number only; name/consent stored separately if needed)
    trustedPersonMobile: {
      type:    String,
      default: null,
    },

    // Assigned helpline — auto-populated if trustedPersonMobile is absent
    assignedHelpline: {
      type:    assignedHelplineSchema,
      default: null,
    },

    // Geographic location for helpline matching
    location: {
      type:    locationSchema,
      default: () => ({ state: '', country: 'India' }),
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Prevent passwordHash from leaking into JSON responses
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.tokenVersion;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
