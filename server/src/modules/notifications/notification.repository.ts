/**
 * INARO — Notification Repository (Member 4)
 * 
 * Manages notification settings, registered device tokens, and query logic
 * for identifying Dump Mode reminder eligibility.
 * 
 * STRICT PRIVACY GUARANTEE:
 * - NEVER queries, accesses, or loads DumpEntry text or mood.
 * - ONLY reads `users.last_dump_at` and notification fields.
 */

import prisma from '../../config/prisma.js';
import { PrismaClient } from '@prisma/client';

export interface EligibleDeviceRecord {
  id: string;
  pushToken: string;
  platform: string;
}

export interface EligibleUserNotificationRecord {
  id: string;
  lastDumpAt: Date;
  lastNotifiedAt: Date | null;
  notificationsEnabled: boolean;
  lastDumpNotificationMessageId: string | null;
  devices: EligibleDeviceRecord[];
}

export interface INotificationRepository {
  /**
   * Finds all users eligible for Dump Mode reminders:
   * - notifications_enabled = true
   * - At least one registered push device
   * - last_dump_at IS NOT NULL (never-dumped users are excluded!)
   * - last_dump_at < inactivityCutoff (e.g. 24h ago)
   * - last_notified_at IS NULL OR last_notified_at < notificationCutoff (e.g. 24h ago)
   */
  findEligibleUsers(inactivityCutoff: Date, notificationCutoff: Date): Promise<EligibleUserNotificationRecord[]>;

  /**
   * Updates last_notified_at and the selected message ID upon successful push.
   */
  updateNotificationSuccess(userId: string, notifiedAt: Date, messageId: string): Promise<void>;

  /**
   * Deletes an invalid or expired push token.
   */
  removeInvalidToken(userId: string, pushToken: string): Promise<void>;

  /**
   * Updates the user's notification preference (enabled/disabled).
   */
  setDumpRemindersEnabled(userId: string, enabled: boolean): Promise<boolean>;

  /**
   * Gets the user's current notification preference.
   */
  getDumpRemindersEnabled(userId: string): Promise<boolean>;

  /**
   * Upserts a push token for the user.
   */
  registerPushToken(userId: string, token: string, platform?: string): Promise<void>;

  /**
   * Gets all active push tokens for a user.
   */
  getPushTokens(userId: string): Promise<EligibleDeviceRecord[]>;

  /**
   * Read-only retrieval of user last_dump_at.
   */
  getUserLastDumpAt(userId: string): Promise<Date | null>;

  /**
   * Read-only retrieval of user last_notified_at.
   */
  getUserLastNotifiedAt(userId: string): Promise<Date | null>;
}

export class PrismaNotificationRepository implements INotificationRepository {
  private client: PrismaClient;

  constructor(client: PrismaClient = prisma) {
    this.client = client;
  }

  async findEligibleUsers(
    inactivityCutoff: Date,
    notificationCutoff: Date
  ): Promise<EligibleUserNotificationRecord[]> {
    // Parameterized query using Prisma Client
    const users = await this.client.user.findMany({
      where: {
        notificationsEnabled: true,
        // MUST have used Dump Mode at least once!
        lastDumpAt: {
          not: null,
          lt: inactivityCutoff,
        },
        // Must not have been notified within last 24h
        OR: [
          { lastNotifiedAt: null },
          { lastNotifiedAt: { lt: notificationCutoff } },
        ],
        // Must have at least one registered push device
        notificationDevices: {
          some: {},
        },
      },
      select: {
        id: true,
        lastDumpAt: true,
        lastNotifiedAt: true,
        notificationsEnabled: true,
        lastDumpNotificationMessageId: true,
        notificationDevices: {
          select: {
            id: true,
            pushToken: true,
            platform: true,
          },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      lastDumpAt: u.lastDumpAt as Date,
      lastNotifiedAt: u.lastNotifiedAt,
      notificationsEnabled: u.notificationsEnabled,
      lastDumpNotificationMessageId: u.lastDumpNotificationMessageId,
      devices: u.notificationDevices.map((d) => ({
        id: d.id,
        pushToken: d.pushToken,
        platform: d.platform,
      })),
    }));
  }

  async updateNotificationSuccess(userId: string, notifiedAt: Date, messageId: string): Promise<void> {
    await this.client.user.update({
      where: { id: userId },
      data: {
        lastNotifiedAt: notifiedAt,
        lastDumpNotificationMessageId: messageId,
      },
    });
  }

  async removeInvalidToken(userId: string, pushToken: string): Promise<void> {
    await this.client.notificationDevice.deleteMany({
      where: {
        userId,
        pushToken,
      },
    });
  }

  async setDumpRemindersEnabled(userId: string, enabled: boolean): Promise<boolean> {
    const updated = await this.client.user.update({
      where: { id: userId },
      data: { notificationsEnabled: enabled },
      select: { notificationsEnabled: true },
    });
    return updated.notificationsEnabled;
  }

  async getDumpRemindersEnabled(userId: string): Promise<boolean> {
    const user = await this.client.user.findUnique({
      where: { id: userId },
      select: { notificationsEnabled: true },
    });
    return user ? user.notificationsEnabled : true;
  }

  async registerPushToken(userId: string, token: string, platform: string = 'web'): Promise<void> {
    await this.client.notificationDevice.upsert({
      where: {
        userId_pushToken: {
          userId,
          pushToken: token,
        },
      },
      create: {
        userId,
        pushToken: token,
        platform,
      },
      update: {
        platform,
        updatedAt: new Date(),
      },
    });
  }

  async getPushTokens(userId: string): Promise<EligibleDeviceRecord[]> {
    const devices = await this.client.notificationDevice.findMany({
      where: { userId },
      select: { id: true, pushToken: true, platform: true },
    });
    return devices;
  }

  async getUserLastDumpAt(userId: string): Promise<Date | null> {
    const user = await this.client.user.findUnique({
      where: { id: userId },
      select: { lastDumpAt: true },
    });
    return user?.lastDumpAt || null;
  }

  async getUserLastNotifiedAt(userId: string): Promise<Date | null> {
    const user = await this.client.user.findUnique({
      where: { id: userId },
      select: { lastNotifiedAt: true },
    });
    return user?.lastNotifiedAt || null;
  }
}

/**
 * In-Memory Notification Repository for Vitest tests and offline development.
 */
export class InMemoryNotificationRepository implements INotificationRepository {
  public users: Map<string, {
    id: string;
    notificationsEnabled: boolean;
    lastDumpAt: Date | null;
    lastNotifiedAt: Date | null;
    lastDumpNotificationMessageId: string | null;
  }> = new Map();

  public devices: Map<string, Array<{ id: string; pushToken: string; platform: string }>> = new Map();

  constructor(initialUsers?: Array<{
    id: string;
    notificationsEnabled?: boolean;
    lastDumpAt?: Date | null;
    lastNotifiedAt?: Date | null;
    lastDumpNotificationMessageId?: string | null;
    devices?: Array<{ id: string; pushToken: string; platform: string }>;
  }>) {
    if (initialUsers) {
      for (const u of initialUsers) {
        this.setUser(u);
      }
    }
  }

  setUser(data: {
    id: string;
    notificationsEnabled?: boolean;
    lastDumpAt?: Date | null;
    lastNotifiedAt?: Date | null;
    lastDumpNotificationMessageId?: string | null;
    devices?: Array<{ id: string; pushToken: string; platform: string }>;
  }): void {
    this.users.set(data.id, {
      id: data.id,
      notificationsEnabled: data.notificationsEnabled ?? true,
      lastDumpAt: data.lastDumpAt ?? null,
      lastNotifiedAt: data.lastNotifiedAt ?? null,
      lastDumpNotificationMessageId: data.lastDumpNotificationMessageId ?? null,
    });

    if (data.devices) {
      this.devices.set(data.id, [...data.devices]);
    }
  }

  async findEligibleUsers(
    inactivityCutoff: Date,
    notificationCutoff: Date
  ): Promise<EligibleUserNotificationRecord[]> {
    const results: EligibleUserNotificationRecord[] = [];

    for (const user of this.users.values()) {
      // Rule 1: notifications_enabled = true
      if (!user.notificationsEnabled) continue;

      // Rule 2: MUST have dumped at least once! (last_dump_at != null)
      if (!user.lastDumpAt) continue;

      // Rule 3: last_dump_at < inactivityCutoff (>24h ago)
      if (user.lastDumpAt.getTime() >= inactivityCutoff.getTime()) continue;

      // Rule 4: last_notified_at is null OR last_notified_at < notificationCutoff (>24h ago)
      if (user.lastNotifiedAt && user.lastNotifiedAt.getTime() >= notificationCutoff.getTime()) continue;

      // Rule 5: push_token exists
      const userDevices = this.devices.get(user.id) || [];
      if (userDevices.length === 0) continue;

      results.push({
        id: user.id,
        lastDumpAt: user.lastDumpAt,
        lastNotifiedAt: user.lastNotifiedAt,
        notificationsEnabled: user.notificationsEnabled,
        lastDumpNotificationMessageId: user.lastDumpNotificationMessageId,
        devices: [...userDevices],
      });
    }

    return results;
  }

  async updateNotificationSuccess(userId: string, notifiedAt: Date, messageId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.lastNotifiedAt = notifiedAt;
      user.lastDumpNotificationMessageId = messageId;
      this.users.set(userId, user);
    }
  }

  async removeInvalidToken(userId: string, pushToken: string): Promise<void> {
    const userDevices = this.devices.get(userId) || [];
    const filtered = userDevices.filter((d) => d.pushToken !== pushToken);
    this.devices.set(userId, filtered);
  }

  async setDumpRemindersEnabled(userId: string, enabled: boolean): Promise<boolean> {
    const user = this.users.get(userId);
    if (user) {
      user.notificationsEnabled = enabled;
      this.users.set(userId, user);
      return enabled;
    }
    this.users.set(userId, {
      id: userId,
      notificationsEnabled: enabled,
      lastDumpAt: null,
      lastNotifiedAt: null,
      lastDumpNotificationMessageId: null,
    });
    return enabled;
  }

  async getDumpRemindersEnabled(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    return user ? user.notificationsEnabled : true;
  }

  async registerPushToken(userId: string, token: string, platform: string = 'web'): Promise<void> {
    const userDevices = this.devices.get(userId) || [];
    const existingIndex = userDevices.findIndex((d) => d.pushToken === token);
    if (existingIndex >= 0) {
      userDevices[existingIndex].platform = platform;
    } else {
      userDevices.push({
        id: `dev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        pushToken: token,
        platform,
      });
    }
    this.devices.set(userId, userDevices);
  }

  async getPushTokens(userId: string): Promise<EligibleDeviceRecord[]> {
    return this.devices.get(userId) || [];
  }

  async getUserLastDumpAt(userId: string): Promise<Date | null> {
    const user = this.users.get(userId);
    return user?.lastDumpAt || null;
  }

  async getUserLastNotifiedAt(userId: string): Promise<Date | null> {
    const user = this.users.get(userId);
    return user?.lastNotifiedAt || null;
  }
}
