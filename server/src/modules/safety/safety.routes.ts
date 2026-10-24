import { Router } from 'express';
import { SafetyController } from './safety.controller';
import { requireAuth } from '../../middleware/auth';
import { toneAnalyzerEngine } from './toneAnalyzer';

export function createSafetyRouter(controller?: SafetyController): Router {
  const router = Router();
  const safetyController = controller || new SafetyController();

  // Evaluate text for acute safety & trigger silent emergency SMS if suicidal intent detected
  router.post('/evaluate', requireAuth, safetyController.evaluateSafety);

  // Analyze text and vocal tone to detect mood and recommend avatar parameters
  router.post('/analyze-tone', (req, res) => {
    const { text, audioFeatures } = req.body || {};
    const result = toneAnalyzerEngine.analyze(text || '', audioFeatures);
    res.status(200).json(result);
  });

  return router;
}

export const safetyRouter = createSafetyRouter();
