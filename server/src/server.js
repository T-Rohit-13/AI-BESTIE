import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'inaro-backend',
    timestamp: new Date().toISOString(),
  });
});

// Root API v1 Route
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    message: 'Welcome to INARO Mental Well-Being API v1',
    modules: ['auth', 'character', 'conversation', 'tracker', 'dump', 'helpline'],
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred on the server.',
    },
    timestamp: new Date().toISOString(),
  });
});

// Start Server & Connect Database
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[INARO Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (err) {
    console.error('[INARO Server Startup Failed]', err);
  }
};

startServer();

export default app;
