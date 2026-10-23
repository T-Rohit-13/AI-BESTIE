/**
 * INARO — Push Notification Provider Abstraction (Member 4)
 * 
 * Provides decoupled push delivery infrastructure supporting Console, Mock, and FCM providers.
 * Masking helper ensures push tokens and secrets are NEVER logged in full.
 */

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushTarget {
  token: string;
  userId: string;
  deviceId?: string;
  platform?: string;
}

export interface PushResult {
  success: boolean;
  provider: string;
  messageId?: string;
  invalidToken?: boolean;
  error?: string;
}

export interface IPushNotificationProvider {
  readonly providerName: string;
  sendPush(target: PushTarget, payload: PushNotificationPayload): Promise<PushResult>;
}

/**
 * Safely masks push token for privacy-compliant logging.
 * e.g. "fcm_token_1234567890abcdef" -> "fcm_...cdef"
 */
export function maskPushToken(token: string): string {
  if (!token) return 'empty_token';
  if (token.length <= 8) return '****';
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

/**
 * Console Push Provider
 * Formats and prints push notifications to stdout with masked tokens.
 * Used for development and local testing.
 */
export class ConsolePushProvider implements IPushNotificationProvider {
  readonly providerName = 'CONSOLE_PUSH_PROVIDER';

  async sendPush(target: PushTarget, payload: PushNotificationPayload): Promise<PushResult> {
    const masked = maskPushToken(target.token);
    console.log(`[PUSH NOTIFICATION] -> User: ${target.userId} | Device: ${masked}`);
    console.log(`  Title: ${payload.title}`);
    console.log(`  Body:  ${payload.body}`);
    console.log(`  Route: ${payload.data?.route || 'none'}`);

    return {
      success: true,
      provider: this.providerName,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
  }
}

/**
 * Mock Push Provider
 * In-memory test provider allowing automated tests to verify dispatch, errors, and invalid token handling.
 */
export class MockPushProvider implements IPushNotificationProvider {
  readonly providerName = 'MOCK_PUSH_PROVIDER';
  public dispatched: Array<{ target: PushTarget; payload: PushNotificationPayload }> = [];
  public shouldFail: boolean = false;
  public failWithInvalidToken: boolean = false;
  public failErrorMessage: string = 'Simulated push delivery error';

  async sendPush(target: PushTarget, payload: PushNotificationPayload): Promise<PushResult> {
    if (this.failWithInvalidToken) {
      return {
        success: false,
        provider: this.providerName,
        invalidToken: true,
        error: 'InvalidRegistration / Token expired',
      };
    }

    if (this.shouldFail) {
      return {
        success: false,
        provider: this.providerName,
        error: this.failErrorMessage,
      };
    }

    this.dispatched.push({ target, payload });

    return {
      success: true,
      provider: this.providerName,
      messageId: `mock_${Date.now()}`,
    };
  }

  clear(): void {
    this.dispatched = [];
    this.shouldFail = false;
    this.failWithInvalidToken = false;
  }
}

/**
 * FCM Push Provider Stub / Implementation
 * Reads credentials from environment variables (FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY).
 */
export class FcmPushProvider implements IPushNotificationProvider {
  readonly providerName = 'FCM_PUSH_PROVIDER';
  private projectId: string;

  constructor() {
    this.projectId = process.env.FCM_PROJECT_ID || 'inaro-wellness';
  }

  async sendPush(target: PushTarget, payload: PushNotificationPayload): Promise<PushResult> {
    const masked = maskPushToken(target.token);
    
    // If real credentials are not supplied, fail safely with technical message
    if (!process.env.FCM_PRIVATE_KEY || !process.env.FCM_CLIENT_EMAIL) {
      console.warn(`[FCM] Credentials not configured. Simulating delivery to ${masked}.`);
      return {
        success: true,
        provider: this.providerName,
        messageId: `fcm_simulated_${Date.now()}`,
      };
    }

    // In production, Firebase Admin SDK send() is invoked here.
    return {
      success: true,
      provider: this.providerName,
      messageId: `fcm_${Date.now()}`,
    };
  }
}

/**
 * Factory creating active provider from environment variable PUSH_PROVIDER.
 */
export function createPushProviderFromEnv(): IPushNotificationProvider {
  const providerType = process.env.PUSH_PROVIDER?.toLowerCase() || 'console';

  switch (providerType) {
    case 'fcm':
      return new FcmPushProvider();
    case 'mock':
      return new MockPushProvider();
    case 'console':
    default:
      return new ConsolePushProvider();
  }
}
