import { Router, Request, Response } from 'express';
import { authService } from './auth.service';

export const authRouter = Router();

// GET /auth/check-username?username=...
authRouter.get('/check-username', (req: Request, res: Response) => {
  const username = (req.query.username as string || '').trim().toLowerCase();
  const reserved = ['admin', 'root', 'inaro', 'support'];
  const isAvailable = username.length >= 3 && !reserved.includes(username);
  return res.status(200).json({ success: true, available: isAvailable });
});

// POST /auth/send-otp
authRouter.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const mobile = req.body.mobile || req.body.mobileNumber || '';
    const countryCode = req.body.countryCode || '+91';
    const username = req.body.username || '';

    if (!mobile || !mobile.toString().trim()) {
      return res.status(400).json({ success: false, error: 'Mobile number is required' });
    }

    const result = await authService.sendOtp(mobile.toString(), countryCode, username);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to send OTP' });
  }
});

// POST /auth/verify-otp
authRouter.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const mobile = req.body.mobile || req.body.mobileNumber || '';
    const otp = req.body.otp || req.body.code || '';
    const signUpData = req.body.signUpData || req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ success: false, error: 'Mobile number and OTP are required' });
    }

    const result = await authService.verifyOtp(mobile.toString(), otp.toString(), signUpData);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Invalid or expired OTP' });
  }
});

// POST /auth/trusted-contact
authRouter.post('/trusted-contact', async (req: Request, res: Response) => {
  try {
    const { userId, contactName, contactPhone } = req.body;
    await authService.saveTrustedContact(userId, contactName, contactPhone);
    return res.status(200).json({ success: true, message: 'Trusted contact saved' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to save contact' });
  }
});

// POST /auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { usernameOrPhone, username, mobile, password } = req.body;
    const identifier = usernameOrPhone || username || mobile;
    if (!identifier) {
      return res.status(400).json({ success: false, error: 'Username or mobile number is required' });
    }
    const result = await authService.login(identifier, password);
    return res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    return res.status(401).json({ success: false, error: err.message || 'Login failed' });
  }
});
