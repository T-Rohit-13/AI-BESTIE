// INARO — Auth Microservice Entry Point (Team Member 1 Scope)
// Sets up Express with all security middleware, rate limiting, and CORS,
// then mounts the auth router and global error handlers.
require('dotenv').config();

const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');

const connectDB  = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.AUTH_PORT || process.env.PORT || 5000;

// ── Database ─────────────────────────────────────────────────────────────────
connectDB();

// ── Security Headers (Helmet) ─────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., curl, Postman, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// ── Rate Limiting (Auth Endpoints) ────────────────────────────────────────────
// Applied globally to /api/auth/* to prevent brute-force and enumeration attacks.
const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15-minute window
  max:              30,              // 30 requests per window per IP
  standardHeaders:  true,
  legacyHeaders:    false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  skipSuccessfulRequests: false,
});

// Stricter rate limit for OTP dispatch (prevents SMS bombing)
const otpLimiter = rateLimit({
  windowMs:        10 * 60 * 1000, // 10-minute window
  max:             5,               // 5 OTP requests per 10 minutes per IP
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait before trying again.',
  },
});

app.use('/api/auth', authLimiter);
app.use('/api/auth/send-otp', otpLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ── Health Check (useful for Docker/K8s liveness probes) ─────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'inaro-auth', timestamp: new Date().toISOString() });
});

// ── 404 & Global Error Handlers (must be registered last) ────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[INARO Auth] Service running on port ${PORT} | env: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; // Exported for integration testing
