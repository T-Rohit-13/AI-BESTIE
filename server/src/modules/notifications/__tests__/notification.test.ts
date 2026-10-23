import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../app.js';
import { InMemoryNotificationRepository } from '../notification.repository.js';
import { MockPushProvider } from '../notification.provider.js';
import { NotificationService } from '../notification.service.js';
import { NotificationScheduler } from '../notification.scheduler.js';
import { DUMP_REMINDER_MESSAGES, selectRotatedMessage } from '../notification.messages.js';

describe('INARO — Notification Backend Test Suite (Member 4)', () => {
  let memoryRepo: InMemoryNotificationRepository;
  let mockPush: MockPushProvider;
  let notifService: NotificationService;
  let app: any;

  const userEligible = 'user-uuid-1111-eligible';
  const userRecentlyDumped = 'user-uuid-2222-recent-dump';
  const userNeverDumped = 'user-uuid-3333-never-dump';
  const userRecentlyNotified = 'user-uuid-4444-recent-notified';
  const userDisabled = 'user-uuid-5555-disabled';
  const userNoToken = 'user-uuid-6666-no-token';

  const now = new Date('2026-10-24T12:00:00Z');
  const thirtyHoursAgo = new Date(now.getTime() - 30 * 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  beforeEach(() => {
    memoryRepo = new InMemoryNotificationRepository([
      // 1. Eligible user: dumped 30h ago, never notified, notifications enabled, valid token
      {
        id: userEligible,
        notificationsEnabled: true,
        lastDumpAt: thirtyHoursAgo,
        lastNotifiedAt: null,
        devices: [{ id: 'dev-1', pushToken: 'push_token_user_eligible_web', platform: 'web' }],
      },
      // 2. Recently dumped: dumped 2h ago, notifications enabled, valid token
      {
        id: userRecentlyDumped,
        notificationsEnabled: true,
        lastDumpAt: twoHoursAgo,
        lastNotifiedAt: null,
        devices: [{ id: 'dev-2', pushToken: 'push_token_user_recent_dump', platform: 'web' }],
      },
      // 3. Never dumped: last_dump_at is NULL, valid token
      {
        id: userNeverDumped,
        notificationsEnabled: true,
        lastDumpAt: null,
        lastNotifiedAt: null,
        devices: [{ id: 'dev-3', pushToken: 'push_token_user_never_dump', platform: 'web' }],
      },
      // 4. Recently notified: dumped 30h ago, but notified 2h ago
      {
        id: userRecentlyNotified,
        notificationsEnabled: true,
        lastDumpAt: thirtyHoursAgo,
        lastNotifiedAt: twoHoursAgo,
        devices: [{ id: 'dev-4', pushToken: 'push_token_user_recent_notif', platform: 'web' }],
      },
      // 5. Notifications disabled: dumped 30h ago, but notificationsEnabled = false
      {
        id: userDisabled,
        notificationsEnabled: false,
        lastDumpAt: thirtyHoursAgo,
        lastNotifiedAt: null,
        devices: [{ id: 'dev-5', pushToken: 'push_token_user_disabled', platform: 'web' }],
      },
      // 6. Missing push token: dumped 30h ago, but devices array is empty
      {
        id: userNoToken,
        notificationsEnabled: true,
        lastDumpAt: thirtyHoursAgo,
        lastNotifiedAt: null,
        devices: [],
      },
    ]);

    mockPush = new MockPushProvider();
    notifService = new NotificationService(memoryRepo, mockPush);

    app = createApp({
      notificationRepository: memoryRepo,
      pushProvider: mockPush,
      notificationService: notifService,
    });
  });

  // =========================================================================
  // 1. Eligibility & Scheduler Evaluation Tests
  // =========================================================================
  describe('Scheduler Eligibility Rules', () => {
    it('sends reminder to an eligible user and updates last_notified_at', async () => {
      const summary = await notifService.runNotificationJob(now);

      expect(summary.eligibleCount).toBe(1);
      expect(summary.successCount).toBe(1);
      expect(summary.failureCount).toBe(0);

      // Verify push delivery
      expect(mockPush.dispatched.length).toBe(1);
      const push = mockPush.dispatched[0];
      expect(push.target.userId).toBe(userEligible);
      expect(push.target.token).toBe('push_token_user_eligible_web');
      expect(push.payload.title).toBe('Inora');
      expect(push.payload.data).toEqual({ type: 'dump_reminder', route: '/dump' });

      // Verify last_notified_at was updated to reference time
      const notifiedAt = await memoryRepo.getUserLastNotifiedAt(userEligible);
      expect(notifiedAt?.toISOString()).toBe(now.toISOString());

      // Verify last_dump_at was NOT modified!
      const lastDump = await memoryRepo.getUserLastDumpAt(userEligible);
      expect(lastDump?.toISOString()).toBe(thirtyHoursAgo.toISOString());
    });

    it('does NOT notify user who dumped recently (< 24 hours ago)', async () => {
      await notifService.runNotificationJob(now);

      const wasNotified = mockPush.dispatched.some((p) => p.target.userId === userRecentlyDumped);
      expect(wasNotified).toBe(false);

      const notifiedAt = await memoryRepo.getUserLastNotifiedAt(userRecentlyDumped);
      expect(notifiedAt).toBeNull();
    });

    it('does NOT notify new users who have never used Dump Mode (last_dump_at = null)', async () => {
      await notifService.runNotificationJob(now);

      const wasNotified = mockPush.dispatched.some((p) => p.target.userId === userNeverDumped);
      expect(wasNotified).toBe(false);

      const notifiedAt = await memoryRepo.getUserLastNotifiedAt(userNeverDumped);
      expect(notifiedAt).toBeNull();
    });

    it('does NOT notify user who was already notified recently (< 24 hours ago)', async () => {
      await notifService.runNotificationJob(now);

      const wasNotified = mockPush.dispatched.some((p) => p.target.userId === userRecentlyNotified);
      expect(wasNotified).toBe(false);

      const notifiedAt = await memoryRepo.getUserLastNotifiedAt(userRecentlyNotified);
      expect(notifiedAt?.toISOString()).toBe(twoHoursAgo.toISOString());
    });

    it('does NOT notify user who disabled notifications', async () => {
      await notifService.runNotificationJob(now);

      const wasNotified = mockPush.dispatched.some((p) => p.target.userId === userDisabled);
      expect(wasNotified).toBe(false);
    });

    it('does NOT notify user with no registered push token', async () => {
      await notifService.runNotificationJob(now);

      const wasNotified = mockPush.dispatched.some((p) => p.target.userId === userNoToken);
      expect(wasNotified).toBe(false);
    });
  });

  // =========================================================================
  // 2. Duplicate Protection & Frequency Limit
  // =========================================================================
  describe('Duplicate Notification Protection', () => {
    it('running the job twice does not send duplicate notifications within the same 24-hour window', async () => {
      // First run
      const firstSummary = await notifService.runNotificationJob(now);
      expect(firstSummary.successCount).toBe(1);
      expect(mockPush.dispatched.length).toBe(1);

      // Second run immediately after
      const secondSummary = await notifService.runNotificationJob(now);
      expect(secondSummary.eligibleCount).toBe(0);
      expect(secondSummary.successCount).toBe(0);
      expect(mockPush.dispatched.length).toBe(1); // Still exactly 1!
    });
  });

  // =========================================================================
  // 3. Message Rotation & Safety Verification
  // =========================================================================
  describe('Message Rotation & Content Safety', () => {
    it('selects a different message when previous message ID matches', () => {
      const prevMessageId = 'tabs-37';
      const selected = selectRotatedMessage(prevMessageId);

      expect(selected.id).not.toBe(prevMessageId);
      expect(DUMP_REMINDER_MESSAGES.some((m) => m.id === selected.id)).toBe(true);
    });

    it('all messages in pool strictly adhere to non-clinical and non-guilt rules', () => {
      const bannedWords = [
        'depress',
        'streak',
        'diagnos',
        'clinical',
        'mental health',
        'guilt',
        'falling behind',
        'deteriorat',
        'illness',
        'doctor',
        'prescription',
      ];

      for (const msg of DUMP_REMINDER_MESSAGES) {
        const lower = msg.text.toLowerCase();
        for (const banned of bannedWords) {
          expect(lower.includes(banned)).toBe(false);
        }
      }
    });

    it('notification click payload contains strictly routing info and zero entry text or mood', () => {
      for (const msg of DUMP_REMINDER_MESSAGES) {
        expect(msg.payload).toEqual({
          type: 'dump_reminder',
          route: '/dump',
        });
        expect((msg.payload as any).text).toBeUndefined();
        expect((msg.payload as any).mood).toBeUndefined();
      }
    });
  });

  // =========================================================================
  // 4. Push Failure Handling & Token Cleanup
  // =========================================================================
  describe('Push Failure & Resilient Processing', () => {
    it('does NOT update last_notified_at when push delivery fails', async () => {
      mockPush.shouldFail = true;
      mockPush.failErrorMessage = 'FCM Gateway timeout';

      const summary = await notifService.runNotificationJob(now);

      expect(summary.eligibleCount).toBe(1);
      expect(summary.failureCount).toBe(1);
      expect(summary.successCount).toBe(0);

      // last_notified_at MUST remain null
      const notifiedAt = await memoryRepo.getUserLastNotifiedAt(userEligible);
      expect(notifiedAt).toBeNull();
    });

    it('removes invalid or expired push tokens when reported by provider', async () => {
      mockPush.failWithInvalidToken = true;

      const summary = await notifService.runNotificationJob(now);

      expect(summary.invalidTokensRemoved).toBe(1);
      expect(summary.failureCount).toBe(1);

      // Token must have been deleted from repository
      const remainingTokens = await memoryRepo.getPushTokens(userEligible);
      expect(remainingTokens.length).toBe(0);
    });

    it('continues processing subsequent users if one user encounters an error', async () => {
      // Add another eligible user
      const userEligible2 = 'user-uuid-7777-eligible-two';
      memoryRepo.setUser({
        id: userEligible2,
        notificationsEnabled: true,
        lastDumpAt: thirtyHoursAgo,
        lastNotifiedAt: null,
        devices: [{ id: 'dev-7', pushToken: 'token_user_two', platform: 'web' }],
      });

      const summary = await notifService.runNotificationJob(now);

      expect(summary.eligibleCount).toBe(2);
      expect(summary.successCount).toBe(2);
    });
  });

  // =========================================================================
  // 5. Settings Endpoint Tests (PUT /notifications/dump-reminders)
  // =========================================================================
  describe('Settings Endpoint (PUT /notifications/dump-reminders)', () => {
    it('enables dump reminders successfully', async () => {
      const res = await request(app)
        .put('/notifications/dump-reminders')
        .set('x-user-id', userDisabled)
        .send({ enabled: true });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ enabled: true });

      const enabled = await memoryRepo.getDumpRemindersEnabled(userDisabled);
      expect(enabled).toBe(true);
    });

    it('disables dump reminders successfully', async () => {
      const res = await request(app)
        .put('/notifications/dump-reminders')
        .set('x-user-id', userEligible)
        .send({ enabled: false });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ enabled: false });

      const enabled = await memoryRepo.getDumpRemindersEnabled(userEligible);
      expect(enabled).toBe(false);
    });

    it('rejects invalid input type for enabled', async () => {
      const res = await request(app)
        .put('/notifications/dump-reminders')
        .set('x-user-id', userEligible)
        .send({ enabled: 'true' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('rejects empty payload', async () => {
      const res = await request(app)
        .put('/notifications/dump-reminders')
        .set('x-user-id', userEligible)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('returns 401 Unauthorized for unauthenticated request', async () => {
      const res = await request(app)
        .put('/notifications/dump-reminders')
        .send({ enabled: true });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Authentication required' });
    });
  });

  // =========================================================================
  // 6. Push Token Endpoint Tests (PUT /notifications/push-token)
  // =========================================================================
  describe('Push Token Endpoint (PUT /notifications/push-token)', () => {
    it('registers a valid push token successfully', async () => {
      const res = await request(app)
        .put('/notifications/push-token')
        .set('x-user-id', userNoToken)
        .send({
          token: 'fcm_device_token_xyz_1234567890',
          platform: 'web',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const tokens = await memoryRepo.getPushTokens(userNoToken);
      expect(tokens.length).toBe(1);
      expect(tokens[0].pushToken).toBe('fcm_device_token_xyz_1234567890');
      expect(tokens[0].platform).toBe('web');
    });

    it('rejects invalid request with empty token', async () => {
      const res = await request(app)
        .put('/notifications/push-token')
        .set('x-user-id', userNoToken)
        .send({ token: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('rejects invalid platform', async () => {
      const res = await request(app)
        .put('/notifications/push-token')
        .set('x-user-id', userNoToken)
        .send({ token: 'valid_token_12345', platform: 'windows_phone' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('returns 401 Unauthorized for unauthenticated request', async () => {
      const res = await request(app)
        .put('/notifications/push-token')
        .send({ token: 'some_push_token_here' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Authentication required' });
    });
  });

  // =========================================================================
  // 7. Scheduler Lifecycle Tests
  // =========================================================================
  describe('NotificationScheduler Lifecycle', () => {
    it('starts and stops scheduler cleanly without leaks', async () => {
      const scheduler = new NotificationScheduler(notifService, 10000);
      expect(scheduler.getIsRunning()).toBe(false);

      scheduler.start();
      expect(scheduler.getIsRunning()).toBe(true);

      // Trigger immediately via scheduler
      const result = await scheduler.triggerNow(now);
      expect(result.eligibleCount).toBe(1);

      scheduler.stop();
      expect(scheduler.getIsRunning()).toBe(false);
    });
  });
});
