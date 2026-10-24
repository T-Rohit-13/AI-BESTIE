import { Request, Response } from 'express';
import { CrisisAlertService, crisisAlertService } from './crisisAlert.service';

export class SafetyController {
  private service: CrisisAlertService;

  constructor(service?: CrisisAlertService) {
    this.service = service || crisisAlertService;
  }

  evaluateSafety = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'anonymous_user';
      const { text, location } = req.body || {};

      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'Text is required for safety evaluation' });
        return;
      }

      // Check client location header if not in body
      const userLocation =
        location ||
        (req.headers['x-user-location'] as string) ||
        (req.headers['x-forwarded-for'] as string);

      const result = await this.service.evaluateAndDispatchSilentAlert(
        userId,
        text,
        userLocation
      );

      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Safety evaluation failed',
      });
    }
  };
}
