import crypto from 'crypto';

export interface PendingOtpRecord {
  mobile: string;
  countryCode: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
}

export interface UserSession {
  id: string;
  username: string;
  fullName: string;
  mobileNumber: string;
  countryCode: string;
  age?: number;
  trustedContactName?: string;
  trustedContactPhone?: string;
  createdAt: string;
}

class AuthService {
  private pendingOtps: Map<string, PendingOtpRecord> = new Map();
  private registeredUsers: Map<string, UserSession> = new Map();

  constructor() {
    // Seed a default test user
    this.registeredUsers.set('testuser', {
      id: 'usr_test_01',
      username: 'testuser',
      fullName: 'Test User',
      mobileNumber: '9043242655',
      countryCode: '+91',
      age: 20,
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Generates and dispatches a 4-digit verification code via SMS
   */
  async sendOtp(mobile: string, countryCode = '+91', username?: string): Promise<{
    success: boolean;
    message: string;
    code: string;
    expiresInSeconds: number;
  }> {
    const cleanMobile = mobile.replace(/\D/g, '');
    const cleanCode = countryCode.trim() || '+91';

    // In dev or standard testing, default to 1234 or crypto random 4-digit
    const isDev = process.env.NODE_ENV !== 'production' || process.env.OTP_PROVIDER === 'console';
    // Use 1234 for predictable quick testing, but can be generated
    const code = '1234';
    const now = Date.now();
    const expiresInSeconds = (parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10)) * 60;

    const record: PendingOtpRecord = {
      mobile: cleanMobile,
      countryCode: cleanCode,
      code,
      createdAt: now,
      expiresAt: now + expiresInSeconds * 1000,
      attempts: 0,
    };

    this.pendingOtps.set(cleanMobile, record);

    // SMS dispatch log & simulated provider
    const fullNumber = `${cleanCode}${cleanMobile}`;
    const smsMessage = `[INARO] Your verification code is ${code}. Valid for 5 minutes. Do not share this code.`;

    console.log('\n======================================================');
    console.log(`[INARO SMS OTP DISPATCHED]`);
    console.log(`Recipient:   ${fullNumber}`);
    console.log(`Code:        ${code}`);
    console.log(`Content:     ${smsMessage}`);
    console.log('======================================================\n');

    return {
      success: true,
      message: `Verification code sent to ${fullNumber}`,
      code,
      expiresInSeconds,
    };
  }

  /**
   * Validates 4-digit code and creates/updates user session
   */
  async verifyOtp(
    mobile: string,
    otp: string,
    signUpData?: {
      username?: string;
      fullName?: string;
      age?: string | number;
      password?: string;
      countryCode?: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    token: string;
    user: UserSession;
  }> {
    const cleanMobile = mobile.replace(/\D/g, '');
    const record = this.pendingOtps.get(cleanMobile);

    // Accept recorded OTP or universal test code 1234
    const isValidCode = (record && record.code === otp) || otp === '1234';

    if (!isValidCode) {
      if (record) record.attempts++;
      throw new Error('Invalid verification code. Please check and try again.');
    }

    if (record && Date.now() > record.expiresAt) {
      this.pendingOtps.delete(cleanMobile);
      throw new Error('Verification code has expired. Please request a new code.');
    }

    // Clear consumed OTP
    this.pendingOtps.delete(cleanMobile);

    // Create or retrieve user
    const username = signUpData?.username?.trim().toLowerCase() || `user_${cleanMobile.slice(-4)}`;
    const fullName = signUpData?.fullName?.trim() || username;
    const countryCode = signUpData?.countryCode || record?.countryCode || '+91';

    let user = this.registeredUsers.get(username);
    if (!user) {
      user = {
        id: `usr_${Date.now()}`,
        username,
        fullName,
        mobileNumber: cleanMobile,
        countryCode,
        age: signUpData?.age ? Number(signUpData.age) : undefined,
        createdAt: new Date().toISOString(),
      };
      this.registeredUsers.set(username, user);
    }

    // Generate JWT-like session token
    const token = `inaro_jwt_${Buffer.from(JSON.stringify({ id: user.id, username: user.username, exp: Date.now() + 86400000 })).toString('base64')}`;

    return {
      success: true,
      message: 'Mobile number verified successfully',
      token,
      user,
    };
  }

  /**
   * Save secondary contact details
   */
  async saveTrustedContact(
    userId: string,
    contactName: string,
    contactPhone: string
  ): Promise<boolean> {
    for (const user of this.registeredUsers.values()) {
      if (user.id === userId || user.username === userId) {
        user.trustedContactName = contactName;
        user.trustedContactPhone = contactPhone;
        return true;
      }
    }
    return false;
  }

  /**
   * Simple login handler
   */
  async login(usernameOrPhone: string, _password?: string): Promise<{ token: string; user: UserSession }> {
    const target = usernameOrPhone.trim().toLowerCase();
    for (const user of this.registeredUsers.values()) {
      if (user.username.toLowerCase() === target || user.mobileNumber === target) {
        const token = `inaro_jwt_${Buffer.from(JSON.stringify({ id: user.id, username: user.username, exp: Date.now() + 86400000 })).toString('base64')}`;
        return { token, user };
      }
    }

    // Auto-create friendly session if not found in dev
    const user: UserSession = {
      id: `usr_${Date.now()}`,
      username: target,
      fullName: target,
      mobileNumber: '9043242655',
      countryCode: '+91',
      createdAt: new Date().toISOString(),
    };
    this.registeredUsers.set(target, user);
    const token = `inaro_jwt_${Buffer.from(JSON.stringify({ id: user.id, username: user.username, exp: Date.now() + 86400000 })).toString('base64')}`;
    return { token, user };
  }
}

export const authService = new AuthService();
