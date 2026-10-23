/**
 * INARO — Notification Service (Member 4)
 * 
 * Orchestrates Dump Mode inactivity reminders, push delivery, message rotation,
 * and user preferences.
 */

import { INotificationRepository, EligibleUserNotificationRecord } from './notification.repository.js';
import { IPushNotificationProvider, maskPushToken } from './notification.provider.js';
import { selectRotatedMessage, DumpReminderMessage } from './notification.messages.js';

export const INACTIVITY_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
export const NOTIFICATION_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface JobRunSummary {
  jobStartedAt: string;
  jobCompletedAt: string;
  eligibleCount: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  invalidTokensRemoved: number;
  durationMs: number;
}

export class NotificationService {
  private repository: INotificationRepository;
  private pushProvider: IPushNotificationProvider;
  private isJobRunning: boolean = false;

  constructor(
    repository: INotificationRepository,
    pushProvider: IPushNotificationProvider
  ) {
    this.repository = repository;
    this.pushProvider = pushProvider;
  }

  /**
   * Updates Dump Mode reminder preference for authenticated user.
   */
  async setDumpRemindersEnabled(userId: string, enabled: boolean): Promise<{ enabled: boolean }> {
    const result = await this.repository.setDumpRemindersEnabled(userId, enabled);
    return { enabled: result };
  }

  /**
   * Retrieves Dump Mode reminder preference for authenticated user.
   */
  async getDumpRemindersEnabled(userId: string): Promise<{ enabled: boolean }> {
    const enabled = await this.repository.getDumpRemindersEnabled(userId);
    return { enabled };
  }

  /**
   * Registers or updates a push token for authenticated user.
   */
  async registerPushToken(userId: string, token: string, platform?: string): Promise<{ success: boolean; message: string }> {
    await this.repository.registerPushToken(userId, token, platform);
    return { success: true, message: 'Push token registered successfully' };
  }

  /**
   * Removes a push token for authenticated user.
   */
  async unregisterPushToken(userId: string, token: string): Promise<{ success: boolean }> {
    await this.repository.removeInvalidToken(userId, token);
    return { success: true };
  }

  /**
   * Core scheduled job workflow:
   * 1. Check duplicate execution lock
   * 2. Find eligible users (last_dump_at > 24h, last_notified_at > 24h, notifications_enabled, tokens exist)
   * 3. Rotate message avoiding previous message
   * 4. Send push notification
   * 5. Update last_notified_at only on success
   * 6. Clean up invalid tokens
   * 7. Resilient error handling across users
   */
  async runNotificationJob(referenceTime: Date = new Date()): Promise<JobRunSummary> {
    if (this.isJobRunning) {
      console.warn('[Notification Job] Job is already running. Skipping concurrent run.');
      return {
        jobStartedAt: referenceTime.toISOString(),
        jobCompletedAt: new Date().toISOString(),
        eligibleCount: 0,
        successCount: 0,
        failureCount: 0,
        skippedCount: 0,
        invalidTokensRemoved: 0,
        durationMs: 0,
      };
    }

    this.isJobRunning = true;
    const startTime = Date.now();
    const jobStartedAt = new Date(startTime).toISOString();

    let successCount = 0;
    let failureCount = 0;
    let invalidTokensRemoved = 0;

    try {
      const inactivityCutoff = new Date(referenceTime.getTime() - INACTIVITY_THRESHOLD_MS);
      const notificationCutoff = new Date(referenceTime.getTime() - NOTIFICATION_COOLDOWN_MS);

      // Find eligible users
      const eligibleUsers: EligibleUserNotificationRecord[] = await this.repository.findEligibleUsers(
        inactivityCutoff,
        notificationCutoff
      );

      console.log(`[Notification Job] Started at ${jobStartedAt}. Eligible users found: ${eligibleUsers.length}`);

      for (const user of eligibleUsers) {
        try {
          // Select rotated message
          const message: DumpReminderMessage = selectRotatedMessage(user.lastDumpNotificationMessageId);

          let userDelivered = false;

          for (const device of user.devices) {
            const pushResult = await this.pushProvider.sendPush(
              {
                token: device.pushToken,
                userId: user.id,
                deviceId: device.id,
                platform: device.platform,
              },
              {
                title: 'Inora',
                body: message.text,
                data: {
                  type: message.payload.type,
                  route: message.payload.route,
                },
              }
            );

            if (pushResult.success) {
              userDelivered = true;
            } else if (pushResult.invalidToken) {
              // Token expired/invalid — remove from database
              console.warn(`[Notification Job] Removing expired token ${maskPushToken(device.pushToken)} for user ${user.id}`);
              await this.repository.removeInvalidToken(user.id, device.pushToken);
              invalidTokensRemoved++;
            } else {
              console.warn(`[Notification Job] Delivery failed for user ${user.id} device ${maskPushToken(device.pushToken)}: ${pushResult.error}`);
            }
          }

          // If successfully sent to at least one device, update last_notified_at
          if (userDelivered) {
            await this.repository.updateNotificationSuccess(user.id, referenceTime, message.id);
            successCount++;
          } else {
            // Failed send — DO NOT update last_notified_at
            failureCount++;
          }
        } catch (err) {
          // Failure on single user must never stop job for subsequent users
          failureCount++;
          console.error(`[Notification Job] Error processing user ${user.id}:`, err instanceof Error ? err.message : String(err));
        }
      }

      const completedAt = Date.now();
      const durationMs = completedAt - startTime;

      console.log(`[Notification Job] Completed in ${durationMs}ms. Success: ${successCount}, Failures: ${failureCount}, Invalid tokens removed: ${invalidTokensRemoved}`);

      return {
        jobStartedAt,
        jobCompletedAt: new Date(completedAt).toISOString(),
        eligibleCount: eligibleUsers.length,
        successCount,
        failureCount,
        skippedCount: 0,
        invalidTokensRemoved,
        durationMs,
      };
    } finally {
      this.isJobRunning = false;
    }
  }
}
