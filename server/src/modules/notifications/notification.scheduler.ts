/**
 * INARO — Notification Scheduler (Member 4)
 * 
 * Periodically invokes NotificationService.runNotificationJob() to evaluate
 * Dump Mode inactivity and send witty push reminders.
 * Default interval: Every 1 hour (3600000ms).
 */

import { NotificationService, JobRunSummary } from './notification.service.js';

export class NotificationScheduler {
  private service: NotificationService;
  private timer: NodeJS.Timeout | null = null;
  private intervalMs: number;
  private isRunning: boolean = false;

  constructor(service: NotificationService, intervalMs: number = 3600000) {
    this.service = service;
    this.intervalMs = intervalMs;
  }

  /**
   * Starts the background scheduler loop.
   */
  start(intervalMs?: number): void {
    if (this.isRunning) {
      console.log('[Notification Scheduler] Scheduler is already active.');
      return;
    }

    if (intervalMs) {
      this.intervalMs = intervalMs;
    }

    this.isRunning = true;
    console.log(`[Notification Scheduler] Started background job with interval ${this.intervalMs}ms (${Math.round(this.intervalMs / 60000)} minutes).`);

    // Run first check after short delay or schedule recurring interval
    this.timer = setInterval(async () => {
      try {
        await this.service.runNotificationJob();
      } catch (err) {
        console.error('[Notification Scheduler] Unhandled error during scheduled run:', err);
      }
    }, this.intervalMs);
  }

  /**
   * Stops the background scheduler loop.
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('[Notification Scheduler] Scheduler stopped.');
  }

  /**
   * Immediately triggers a single execution cycle (useful for tests or manual worker invocations).
   */
  async triggerNow(referenceTime?: Date): Promise<JobRunSummary> {
    return this.service.runNotificationJob(referenceTime);
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }
}
