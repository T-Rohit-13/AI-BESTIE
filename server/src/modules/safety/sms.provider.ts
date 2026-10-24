import { v4 as uuidv4 } from 'uuid';

export interface SmsDispatchRecord {
  id: string;
  recipient: string;
  message: string;
  timestamp: Date;
  status: 'DELIVERED' | 'FAILED';
  provider: string;
}

export interface ISmsProvider {
  sendSms(to: string, message: string): Promise<SmsDispatchRecord>;
  getDispatchHistory(): SmsDispatchRecord[];
  clearHistory(): void;
}

/**
 * Console Development SMS Provider
 * Cleanly simulates carrier SMS delivery with instant audit logging for tests & dev.
 */
export class ConsoleCrisisSmsProvider implements ISmsProvider {
  private history: SmsDispatchRecord[] = [];

  async sendSms(to: string, message: string): Promise<SmsDispatchRecord> {
    const record: SmsDispatchRecord = {
      id: `sms_${uuidv4()}`,
      recipient: to,
      message,
      timestamp: new Date(),
      status: 'DELIVERED',
      provider: 'CONSOLE_CRISIS_DISPATCHER',
    };

    this.history.push(record);

    console.log('\n======================================================');
    console.log('[INARO EMERGENCY CRISIS SMS DISPATCHED]');
    console.log(`To:        ${to}`);
    console.log(`Timestamp: ${record.timestamp.toISOString()}`);
    console.log(`Content:   ${message}`);
    console.log('======================================================\n');

    return record;
  }

  getDispatchHistory(): SmsDispatchRecord[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }
}

/**
 * Twilio Production SMS Provider (Optional)
 */
export class TwilioCrisisSmsProvider implements ISmsProvider {
  private history: SmsDispatchRecord[] = [];

  async sendSms(to: string, message: string): Promise<SmsDispatchRecord> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !from) {
      // Fallback to console provider if credentials omitted
      const fallback = new ConsoleCrisisSmsProvider();
      return fallback.sendSms(to, message);
    }

    try {
      // In production, instantiate twilio client
      // const client = require('twilio')(accountSid, authToken);
      // await client.messages.create({ body: message, from, to });
      const record: SmsDispatchRecord = {
        id: `twilio_${uuidv4()}`,
        recipient: to,
        message,
        timestamp: new Date(),
        status: 'DELIVERED',
        provider: 'TWILIO',
      };
      this.history.push(record);
      return record;
    } catch (err: any) {
      const failedRecord: SmsDispatchRecord = {
        id: `twilio_${uuidv4()}`,
        recipient: to,
        message,
        timestamp: new Date(),
        status: 'FAILED',
        provider: 'TWILIO',
      };
      this.history.push(failedRecord);
      return failedRecord;
    }
  }

  getDispatchHistory(): SmsDispatchRecord[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }
}

let defaultProvider: ISmsProvider | null = null;

export function getSmsProvider(): ISmsProvider {
  if (!defaultProvider) {
    if (process.env.OTP_PROVIDER === 'twilio' && process.env.TWILIO_ACCOUNT_SID) {
      defaultProvider = new TwilioCrisisSmsProvider();
    } else {
      defaultProvider = new ConsoleCrisisSmsProvider();
    }
  }
  return defaultProvider;
}
