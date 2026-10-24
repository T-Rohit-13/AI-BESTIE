// INARO — Pluggable OTP Provider (Team Member 1 Scope)
// Mirrors the ConsoleDevOtpProvider / Twilio pattern from TEAM_OWNERSHIP.md.
// OTP_PROVIDER=console  => prints OTP to terminal (local dev, free)
// OTP_PROVIDER=twilio   => dispatches real SMS via Twilio (production)

const OTP_PROVIDER = process.env.OTP_PROVIDER || 'console';

/**
 * Console OTP Provider — logs the OTP to stdout.
 * Zero cost, zero configuration, safe for local development.
 */
const consoleProvider = {
  async sendOtp(mobile, otp, purpose) {
    console.log('━'.repeat(50));
    console.log(`[OTP | ConsoleDevProvider]`);
    console.log(`  Mobile  : ${mobile}`);
    console.log(`  Purpose : ${purpose}`);
    console.log(`  OTP Code: ${otp}  (expires in 5 minutes)`);
    console.log('━'.repeat(50));
    return { success: true, provider: 'console' };
  },
};

/**
 * Twilio SMS Provider — sends real SMS.
 * Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env.
 */
const twilioProvider = {
  async sendOtp(mobile, otp, purpose) {
    // Lazy-load Twilio only when actually needed to keep dev startup fast
    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const purposeLabel = purpose === 'REGISTRATION' ? 'registration' : 'password reset';
    const body = `[INARO] Your ${purposeLabel} OTP is ${otp}. Valid for 5 minutes. Do not share this code.`;

    await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to:   mobile,
    });

    return { success: true, provider: 'twilio' };
  },
};

const provider = OTP_PROVIDER === 'twilio' ? twilioProvider : consoleProvider;

/**
 * Sends an OTP to the specified mobile number.
 * The OTP itself is generated in the controller; this service only dispatches.
 *
 * @param {string} mobile - E.164 or local mobile number
 * @param {string} otp    - Plaintext 6-digit OTP (never stored; only sent)
 * @param {string} purpose - 'REGISTRATION' | 'PASSWORD_RESET'
 */
const sendOtpSms = async (mobile, otp, purpose) => {
  return provider.sendOtp(mobile, otp, purpose);
};

module.exports = { sendOtpSms };
