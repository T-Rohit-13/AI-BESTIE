// INARO — Auth Controller (Team Member 1 Scope)
// Implements all five core auth flows:
//   1. checkUsername  — GET  /api/auth/check-username
//   2. sendOtp        — POST /api/auth/send-otp
//   3. verifyOtp      — POST /api/auth/verify-otp
//   4. register       — POST /api/auth/register
//   5. login          — POST /api/auth/login
//   6. resetPassword  — POST /api/auth/reset-password

const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');

const User = require('../models/User');
const Otp  = require('../models/Otp');

const { signAuthToken, signVerificationToken, verifyToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');
const { sendOtpSms }             = require('../services/otpService');
const { resolveHelpline, isValidHelpline } = require('../services/helplineService');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
const OTP_RATE_LIMIT_MS = 60 * 1000; // 1 OTP per minute per mobile

// ─── 1. Check Username Availability ─────────────────────────────────────────
// GET /api/auth/check-username?username=xyz
const checkUsername = async (req, res, next) => {
  try {
    const { username } = req.query;
    const exists = await User.exists({ username: username.toLowerCase().trim() });
    return sendSuccess(res, 200, 'Username availability checked', {
      available: !exists,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 2. Send OTP ─────────────────────────────────────────────────────────────
// POST /api/auth/send-otp
// Body: { mobile, purpose }
const sendOtp = async (req, res, next) => {
  try {
    const { mobile, purpose } = req.body;

    // Rate limit: max 1 OTP per minute per mobile+purpose
    const recentOtp = await Otp.findOne({
      mobile,
      purpose,
      createdAt: { $gte: new Date(Date.now() - OTP_RATE_LIMIT_MS) },
    }).sort({ createdAt: -1 });

    if (recentOtp) {
      return sendError(res, 429, 'Please wait before requesting another OTP');
    }

    // For REGISTRATION, block if mobile is already a verified account
    if (purpose === 'REGISTRATION') {
      const existingUser = await User.findOne({ mobileNumber: mobile, isMobileVerified: true });
      if (existingUser) {
        return sendError(res, 409, 'This mobile number is already registered');
      }
    }

    // For PASSWORD_RESET, block if no account exists
    if (purpose === 'PASSWORD_RESET') {
      const userExists = await User.exists({ mobileNumber: mobile });
      if (!userExists) {
        // Anti-enumeration: respond with generic success to prevent account discovery
        return sendSuccess(res, 200, 'If this number is registered, an OTP has been sent');
      }
    }

    // Generate cryptographically secure 6-digit OTP
    const otpPlaintext = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otpPlaintext, 10);

    // Invalidate any previous active (non-consumed) OTPs for this mobile+purpose
    await Otp.deleteMany({ mobile, purpose, isConsumed: false });

    // Persist the new OTP record
    await Otp.create({ mobile, otpHash, purpose });

    // Dispatch OTP via the configured provider (console or Twilio)
    await sendOtpSms(mobile, otpPlaintext, purpose);

    return sendSuccess(res, 200, 'OTP sent successfully. Valid for 5 minutes.');
  } catch (err) {
    next(err);
  }
};

// ─── 3. Verify OTP ───────────────────────────────────────────────────────────
// POST /api/auth/verify-otp
// Body: { mobile, otp, purpose }
const verifyOtp = async (req, res, next) => {
  try {
    const { mobile, otp: otpPlaintext, purpose } = req.body;

    // Find the most recent non-consumed OTP for this mobile+purpose
    const otpRecord = await Otp.findOne({
      mobile,
      purpose,
      isConsumed: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return sendError(res, 400, 'No active OTP found. Please request a new one.');
    }

    // Check expiry (belt-and-suspenders alongside MongoDB TTL index)
    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return sendError(res, 400, 'OTP has expired. Please request a new one.');
    }

    // Check attempt lockout BEFORE verifying to prevent timing attacks
    if (otpRecord.attempts >= 3) {
      return sendError(res, 429, 'Too many failed attempts. Please request a new OTP.');
    }

    // Constant-time bcrypt comparison
    const isMatch = await bcrypt.compare(otpPlaintext, otpRecord.otpHash);

    if (!isMatch) {
      // Increment attempts on failure
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = 3 - otpRecord.attempts;
      return sendError(res, 400, `Incorrect OTP. ${remaining} attempt(s) remaining.`);
    }

    // OTP verified — mark as consumed
    otpRecord.isConsumed = true;
    await otpRecord.save();

    // Issue a short-lived verification token (10 min) to gate downstream actions
    const verificationToken = signVerificationToken(mobile, purpose);

    return sendSuccess(res, 200, 'OTP verified successfully', { verificationToken });
  } catch (err) {
    next(err);
  }
};

// ─── 4. Register ─────────────────────────────────────────────────────────────
// POST /api/auth/register
// Body: { username, fullName, age, personalMobile, password, verificationToken,
//         trustedPersonMobile?, location? }
const register = async (req, res, next) => {
  try {
    const {
      username,
      fullName,
      age,
      personalMobile,
      password,
      verificationToken,
      trustedPersonMobile,
      location,
    } = req.body;

    // Verify the OTP verification token issued by /verify-otp
    let tokenPayload;
    try {
      tokenPayload = verifyToken(verificationToken);
    } catch {
      return sendError(res, 401, 'Mobile verification token is invalid or has expired. Please verify your mobile again.');
    }

    if (
      !tokenPayload.verified ||
      tokenPayload.mobile  !== personalMobile ||
      tokenPayload.purpose !== 'REGISTRATION'
    ) {
      return sendError(res, 401, 'Mobile verification token does not match this mobile number or purpose.');
    }

    // Check uniqueness (belt-and-suspenders alongside Mongoose unique index)
    const [usernameTaken, mobileTaken] = await Promise.all([
      User.exists({ username: username.toLowerCase().trim() }),
      User.exists({ mobileNumber: personalMobile }),
    ]);

    if (usernameTaken) return sendError(res, 409, 'Username is already taken');
    if (mobileTaken)   return sendError(res, 409, 'Mobile number is already registered');

    // Hash password with bcrypt (10-12 salt rounds as specified)
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Resolve helpline: only auto-assign if trustedPersonMobile is NOT provided
    let assignedHelpline = null;
    const hasTrustedContact = trustedPersonMobile && trustedPersonMobile.trim().length > 0;

    if (!hasTrustedContact) {
      const resolved = resolveHelpline(location?.state);
      if (isValidHelpline(resolved)) {
        assignedHelpline = {
          name:   resolved.name,
          phone:  resolved.phone,
          region: resolved.region,
        };
      }
    }

    // Create the user document
    const newUser = await User.create({
      username:           username.toLowerCase().trim(),
      fullName:           fullName.trim(),
      age:                Number(age),
      mobileNumber:       personalMobile,
      isMobileVerified:   true, // Confirmed by verificationToken above
      passwordHash,
      trustedPersonMobile: hasTrustedContact ? trustedPersonMobile.trim() : null,
      assignedHelpline,
      location: {
        state:   location?.state   || '',
        country: location?.country || 'India',
      },
    });

    // Issue auth JWT
    const token = signAuthToken(newUser);

    return sendSuccess(res, 201, 'Account created successfully! Welcome to INARO.', {
      token,
      user: newUser.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// ─── 5. Login ────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { usernameOrMobile, password }
const login = async (req, res, next) => {
  try {
    const { usernameOrMobile, password } = req.body;

    const identifier = usernameOrMobile.trim();

    // Resolve user by username OR mobile number
    const user = await User.findOne({
      $or: [
        { username:     identifier.toLowerCase() },
        { mobileNumber: identifier },
      ],
    });

    // Constant-time path: always run bcrypt.compare even on no-user to prevent timing attacks
    const DUMMY_HASH = '$2b$12$invalidhashfortimingprotection000000000000000000000000';
    const passwordToCheck = user ? user.passwordHash : DUMMY_HASH;
    const isMatch = await bcrypt.compare(password, passwordToCheck);

    if (!user || !isMatch) {
      return sendError(res, 401, 'Invalid credentials. Please check your username/mobile and password.');
    }

    const token = signAuthToken(user);

    return sendSuccess(res, 200, 'Login successful', {
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// ─── 6. Reset Password ───────────────────────────────────────────────────────
// POST /api/auth/reset-password
// Body: { mobile, otp, newPassword }
const resetPassword = async (req, res, next) => {
  try {
    const { mobile, otp: otpPlaintext, newPassword } = req.body;

    // Find the most recent non-consumed PASSWORD_RESET OTP
    const otpRecord = await Otp.findOne({
      mobile,
      purpose:    'PASSWORD_RESET',
      isConsumed: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return sendError(res, 400, 'No active password reset OTP found. Please request a new one.');
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return sendError(res, 400, 'OTP has expired. Please request a new one.');
    }

    if (otpRecord.attempts >= 3) {
      return sendError(res, 429, 'Too many failed attempts. Please request a new OTP.');
    }

    const isMatch = await bcrypt.compare(otpPlaintext, otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = 3 - otpRecord.attempts;
      return sendError(res, 400, `Incorrect OTP. ${remaining} attempt(s) remaining.`);
    }

    // OTP is valid — update password and revoke all active sessions via tokenVersion bump
    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    const updatedUser = await User.findOneAndUpdate(
      { mobileNumber: mobile },
      {
        $set: { passwordHash: newPasswordHash },
        $inc: { tokenVersion: 1 }, // Invalidate all existing JWTs
      },
      { new: true }
    );

    if (!updatedUser) {
      return sendError(res, 404, 'No account found with this mobile number.');
    }

    // Consume this OTP and delete all other PASSWORD_RESET OTPs for this mobile
    await Otp.deleteMany({ mobile, purpose: 'PASSWORD_RESET' });

    return sendSuccess(res, 200, 'Password reset successfully. Please log in with your new password.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkUsername,
  sendOtp,
  verifyOtp,
  register,
  login,
  resetPassword,
};
