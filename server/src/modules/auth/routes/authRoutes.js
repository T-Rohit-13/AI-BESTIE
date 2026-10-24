// INARO — Auth Routes (Team Member 1 Scope)
// Wires validators + controller handlers onto the Express router.
// Rate limiting is applied at the server level (see server.js) for all /api/auth/* routes.
const { Router } = require('express');

const {
  checkUsername,
  sendOtp,
  verifyOtp,
  register,
  login,
  resetPassword,
} = require('../controllers/authController');

const {
  validateCheckUsername,
  validateSendOtp,
  validateVerifyOtp,
  validateRegister,
  validateLogin,
  validateResetPassword,
  handleValidationErrors,
} = require('../middleware/validators');

const { authenticate } = require('../middleware/authMiddleware');

const router = Router();

// ── Public Auth Routes ────────────────────────────────────────────────────────

// GET  /api/auth/check-username?username=xyz
router.get(
  '/check-username',
  validateCheckUsername,
  handleValidationErrors,
  checkUsername
);

// POST /api/auth/send-otp
router.post(
  '/send-otp',
  validateSendOtp,
  handleValidationErrors,
  sendOtp
);

// POST /api/auth/verify-otp
router.post(
  '/verify-otp',
  validateVerifyOtp,
  handleValidationErrors,
  verifyOtp
);

// POST /api/auth/register
router.post(
  '/register',
  validateRegister,
  handleValidationErrors,
  register
);

// POST /api/auth/login
router.post(
  '/login',
  validateLogin,
  handleValidationErrors,
  login
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  validateResetPassword,
  handleValidationErrors,
  resetPassword
);

// ── Protected Route (example — used by other modules to verify session) ───────

// GET /api/auth/me  — returns the current user profile
router.get('/me', authenticate, (req, res) => {
  const { sendSuccess } = require('../utils/response');
  return sendSuccess(res, 200, 'Authenticated user profile', { user: req.user.toSafeObject() });
});

module.exports = router;
