import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service.js';
import { updateDumpRemindersSchema, registerPushTokenSchema } from './notification.validation.js';
import { maskPushToken } from './notification.provider.js';

export class NotificationController {
  private service: NotificationService;

  constructor(service: NotificationService) {
    this.service = service;
  }

  /**
   * PUT /notifications/dump-reminders
   * Toggles Dump Mode inactivity reminders on or off for authenticated user.
   */
  setDumpReminders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const parsed = updateDumpRemindersSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.issues.map((i) => i.message),
        });
        return;
      }

      const result = await this.service.setDumpRemindersEnabled(userId, parsed.data.enabled);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /notifications/dump-reminders
   * Retrieves current Dump Mode reminder preference.
   */
  getDumpReminders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const result = await this.service.getDumpRemindersEnabled(userId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * PUT /notifications/push-token
   * Registers a push token for authenticated user.
   * Never logs the complete token.
   */
  registerPushToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const parsed = registerPushTokenSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.issues.map((i) => i.message),
        });
        return;
      }

      const masked = maskPushToken(parsed.data.token);
      console.log(`[Push Token API] User ${userId} registering token: ${masked} (${parsed.data.platform})`);

      const result = await this.service.registerPushToken(
        userId,
        parsed.data.token,
        parsed.data.platform
      );

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /notifications/push-token
   * Unregisters a push token for authenticated user.
   */
  unregisterPushToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const token = req.body?.token;
      if (!token || typeof token !== 'string') {
        res.status(400).json({ error: 'Field "token" is required.' });
        return;
      }

      const result = await this.service.unregisterPushToken(userId, token);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /notifications/trigger-job
   * Manually runs notification evaluation cycle (protected for testing / cron triggers).
   */
  triggerJob = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const summary = await this.service.runNotificationJob();
      res.status(200).json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  };
}
