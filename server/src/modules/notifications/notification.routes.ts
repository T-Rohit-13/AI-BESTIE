import { Router } from 'express';
import { NotificationController } from './notification.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { writeRateLimiter } from '../../middleware/rateLimiter.js';

export function createNotificationRouter(controller: NotificationController): Router {
  const router = Router();

  // Enforce authentication gate across all notification routes
  router.use(requireAuth);

  // Dump Mode reminder preferences
  router.put('/dump-reminders', writeRateLimiter, controller.setDumpReminders);
  router.get('/dump-reminders', controller.getDumpReminders);

  // Push token registration
  router.put('/push-token', writeRateLimiter, controller.registerPushToken);
  router.delete('/push-token', writeRateLimiter, controller.unregisterPushToken);

  // Manual trigger for testing and cron triggers
  router.post('/trigger-job', writeRateLimiter, controller.triggerJob);

  return router;
}
