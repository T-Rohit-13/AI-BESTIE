// INARO — Input Validation Rules (Team Member 1 Scope)
// Uses express-validator. All rules are co-located with the middleware layer
// so controllers stay thin and focus only on business logic.
const { body, query, validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

// ── Reusable field validators ────────────────────────────────────────────────

const mobileValidator = (field = 'mobile') =>
  body(field)
    .trim()
    .notEmpty().withMessage('Mobile number is required')
    .matches(/^\+?[1-9]\d{9,14}$/).withMessage('Invalid mobile number format');

const passwordValidator = (field = 'password') =>
  body(field)
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one digit');

// ── Route-specific validation chains ────────────────────────────────────────

const validateCheckUsername = [
  query('username')
    .trim()
    .notEmpty().withMessage('Username query param is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^[a-z0-9_.-]+$/i).withMessage('Username contains invalid characters'),
];

const validateSendOtp = [
  mobileValidator('mobile'),
  body('purpose')
    .isIn(['REGISTRATION', 'PASSWORD_RESET']).withMessage('Invalid OTP purpose'),
];

const validateVerifyOtp = [
  mobileValidator('mobile'),
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
    .isNumeric().withMessage('OTP must contain only digits'),
  body('purpose')
    .isIn(['REGISTRATION', 'PASSWORD_RESET']).withMessage('Invalid OTP purpose'),
];

const validateRegister = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^[a-z0-9_.-]+$/i).withMessage('Username contains invalid characters'),
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required'),
  body('age')
    .isInt({ min: 13 }).withMessage('You must be at least 13 years old'),
  mobileValidator('personalMobile'),
  passwordValidator('password'),
  body('verificationToken')
    .notEmpty().withMessage('Mobile verification token is required'),
  // trustedPersonMobile is optional
  body('trustedPersonMobile')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^\+?[1-9]\d{9,14}$/).withMessage('Invalid trusted contact mobile format'),
  // location is optional
  body('location.state')
    .optional({ nullable: true, checkFalsy: true })
    .isString(),
  body('location.country')
    .optional({ nullable: true, checkFalsy: true })
    .isString(),
];

const validateLogin = [
  body('usernameOrMobile')
    .trim()
    .notEmpty().withMessage('Username or mobile is required'),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

const validateResetPassword = [
  mobileValidator('mobile'),
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
    .isNumeric().withMessage('OTP must contain only digits'),
  passwordValidator('newPassword'),
];

// ── Validation result handler ────────────────────────────────────────────────

/**
 * Middleware that checks for validation errors and short-circuits with 422.
 * Attach AFTER the individual validator chains in the route definition.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 422, 'Validation failed', {
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = {
  validateCheckUsername,
  validateSendOtp,
  validateVerifyOtp,
  validateRegister,
  validateLogin,
  validateResetPassword,
  handleValidationErrors,
};
