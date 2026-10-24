import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createDumpRouter } from './modules/dump/dump.routes';
import { DumpController } from './modules/dump/dump.controller';
import { DumpService } from './modules/dump/dump.service';
import { safetyRouter } from './modules/safety/safety.routes';
import { chatRouter } from './modules/chat/chat.routes';
import { authRouter } from './modules/auth/auth.routes';

dotenv.config();

export function createApp(dumpService?: DumpService): Application {
  const app: Application = express();

  // Basic middleware
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'INARO Backend' });
  });

  // Verified Government & Crisis Helplines Directory
  const getHelplines = (_req: Request, res: Response) => {
    res.status(200).json([
      {
        id: 'help_gov_01',
        category: 'GOVERNMENT',
        serviceName: 'Tele-MANAS (Govt of India 24/7 Mental Health Care)',
        phoneNumber: '14416',
        description: 'Official Government of India 24/7 toll-free psychiatric care and psychological counselling helpline available in 20+ languages.',
        operatingHours: '24/7 Toll-Free',
        languages: ['English', 'Tamil', 'Hindi', '20+ Regional languages'],
        region: 'Pan-India (All States & UTs)',
        isVerified: true,
        dialerUri: 'tel:14416',
      },
      {
        id: 'help_gov_02',
        category: 'GOVERNMENT',
        serviceName: 'KIRAN Mental Health Rehabilitation Helpline',
        phoneNumber: '1800-599-0019',
        description: 'Ministry of Social Justice & Empowerment 24/7 national mental health helpline for psychological first aid and screening.',
        operatingHours: '24/7 Toll-Free',
        languages: ['English', 'Tamil', 'Hindi', 'Regional languages'],
        region: 'National (India)',
        isVerified: true,
        dialerUri: 'tel:18005990019',
      },
      {
        id: 'help_gov_03',
        category: 'GOVERNMENT',
        serviceName: 'NIMHANS National Mental Health Centre of Excellence',
        phoneNumber: '080-46110007',
        description: 'Premier national mental health institute offering round-the-clock crisis psychological intervention and psychiatric guidance.',
        operatingHours: '24/7 Dedicated Cell',
        languages: ['English', 'Tamil', 'Kannada', 'Hindi'],
        region: 'National / Bengaluru',
        isVerified: true,
        dialerUri: 'tel:08046110007',
      },
      {
        id: 'help_gov_04',
        category: 'GOVERNMENT',
        serviceName: 'Institute of Mental Health (IMH) Kilpauk (Govt Psychiatric Cell)',
        phoneNumber: '044-26425585',
        description: 'Government Psychiatric Hospital round-the-clock emergency psychiatric triage, crisis counselling and intervention unit.',
        operatingHours: '24/7 Emergency Cell',
        languages: ['Tamil', 'English'],
        region: 'Chennai / Tamil Nadu',
        isVerified: true,
        dialerUri: 'tel:04426425585',
      },
      {
        id: 'help_gov_05',
        category: 'GOVERNMENT',
        serviceName: 'National Emergency Response Helpline',
        phoneNumber: '112',
        description: 'All-in-one emergency response service connecting to police, emergency medical services, and crisis ambulances.',
        operatingHours: '24/7 Immediate Dispatch',
        languages: ['All Regional Languages'],
        region: 'Pan-India',
        isVerified: true,
        dialerUri: 'tel:112',
      },
      {
        id: 'help_06',
        category: 'CRISIS_COUNSELLING',
        serviceName: 'AASRA Suicide Prevention & Distress Helpline',
        phoneNumber: '91-9820466726',
        description: '24/7 confidential crisis counselling for individuals contemplating self-harm, depressed or facing acute emotional trauma.',
        operatingHours: '24/7',
        languages: ['English', 'Hindi'],
        region: 'National',
        isVerified: true,
        dialerUri: 'tel:919820466726',
      },
      {
        id: 'help_07',
        category: 'STUDENT_SUPPORT',
        serviceName: 'Vandrevala Foundation Mental Health Support',
        phoneNumber: '9999 666 555',
        description: 'Free, compassionate mental health counseling with trained psychologists and experienced mental health workers.',
        operatingHours: '24/7',
        languages: ['English', 'Tamil', 'Hindi'],
        region: 'National',
        isVerified: true,
        dialerUri: 'tel:9999666555',
      },
    ]);
  };
  app.get('/support-resources', getHelplines);
  app.get('/api/v1/support-resources', getHelplines);

  // Mount Dump Mode routes at both /dump and /api/v1/dump
  const dumpController = new DumpController(dumpService);
  const dumpRouter = createDumpRouter(dumpController);

  app.use('/dump', dumpRouter);
  app.use('/api/v1/dump', dumpRouter);

  // Mount Safety & Crisis Alert routes
  app.use('/safety', safetyRouter);
  app.use('/api/v1/safety', safetyRouter);

  // Mount Companion Chat routes (Gemini / Friend persona & Games)
  app.use('/chat', chatRouter);
  app.use('/api/v1/chat', chatRouter);

  // Mount Authentication & OTP routes
  app.use('/auth', authRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/v1/auth', authRouter);

  // 404 handler for unknown routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  // Central error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || 500;
    // Never expose stack trace, SQL errors, or encryption details in production
    res.status(status).json({
      error: err.message || 'Internal server error',
    });
  });

  return app;
}

export const app = createApp();
