import { Router, Request, Response } from 'express';
import { chatService } from './chat.service';
import { crisisAlertService } from '../safety/crisisAlert.service';

export const chatRouter = Router();

// POST /chat/characters/:characterId/messages
chatRouter.post('/characters/:characterId/messages', async (req: Request, res: Response) => {
  try {
    const { characterId } = req.params;
    const { text, history, apiKey, location } = req.body;

    const messageText = typeof text === 'string' ? text : req.body.textContent || '';
    if (!messageText.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    // Silent Crisis safety check
    const userLocation = location || req.headers['x-user-location'] as string || 'Chennai, Tamil Nadu';
    const userId = req.headers['x-user-id'] as string || 'user_anon';
    await crisisAlertService.evaluateAndDispatchSilentAlert(userId, messageText, userLocation).catch(() => {});

    // Generate friend persona response (via Gemini or friend fallback)
    const result = await chatService.generateResponse(characterId, messageText, history, apiKey);

    return res.status(200).json({
      messageId: result.messageId,
      characterId,
      textContent: result.textContent,
      detectedMood: result.detectedMood || 'calm',
      audioUrl: null,
      audioDuration: 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Failed to process message',
      details: err?.message,
    });
  }
});

// GET /chat/characters/:characterId/history
chatRouter.get('/characters/:characterId/history', (req: Request, res: Response) => {
  const { characterId } = req.params;
  const history = chatService.getHistory(characterId);
  return res.status(200).json({ success: true, characterId, history });
});

// DELETE /chat/characters/:characterId/history
chatRouter.delete('/characters/:characterId/history', (req: Request, res: Response) => {
  const { characterId } = req.params;
  chatService.clearHistory(characterId);
  return res.status(200).json({ success: true, message: `History cleared for ${characterId}` });
});

// POST /chat/train-tone (Ingest custom user dataset to train companion tone & responses)
chatRouter.post('/train-tone', (req: Request, res: Response) => {
  try {
    const dataset = req.body.dataset || req.body.samples || req.body;
    const result = chatService.trainDataset(dataset);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to train dataset' });
  }
});
