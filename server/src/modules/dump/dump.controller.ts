import { Request, Response } from 'express';
import { DumpService } from './dump.service';
import { crisisAlertService } from '../safety/crisisAlert.service';

export class DumpController {
  private dumpService: DumpService;

  constructor(dumpService?: DumpService) {
    this.dumpService = dumpService || new DumpService();
  }

  /**
   * PUT /dump/space-name
   */
  renameSpaceName = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { name } = req.body || {};

      if (typeof name !== 'string') {
        res.status(400).json({ error: 'Name must be between 1 and 40 characters' });
        return;
      }

      const trimmed = name.trim();
      if (!trimmed || trimmed.length > 40) {
        res.status(400).json({ error: 'Name must be between 1 and 40 characters' });
        return;
      }

      const savedName = await this.dumpService.renameSpaceName(userId, trimmed);
      res.status(200).json({ name: savedName });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        error: error.message || 'Failed to rename dump space',
      });
    }
  };

  /**
   * GET /dump/space-name
   */
  getSpaceName = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const name = await this.dumpService.getSpaceName(userId);
      res.status(200).json({ name });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        error: error.message || 'Failed to retrieve space name',
      });
    }
  };

  /**
   * POST /dump/entries
   */
  createEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { text, mood } = req.body || {};

      // Never accept user_id from client body
      if (req.body && 'user_id' in req.body) {
        // Discard client-supplied user_id, always use req.user.id
      }

      if (typeof text !== 'string') {
        res.status(400).json({ error: 'Text must be between 1 and 10000 characters' });
        return;
      }

      const trimmedText = text.trim();
      if (!trimmedText || trimmedText.length > 10000) {
        res.status(400).json({ error: 'Text must be between 1 and 10000 characters' });
        return;
      }

      if (mood !== undefined && mood !== null) {
        if (typeof mood !== 'number' || !Number.isInteger(mood) || mood < 1 || mood > 5) {
          res.status(400).json({ error: 'Mood must be an integer between 1 and 5' });
          return;
        }
      }

      // Asynchronously trigger silent crisis check without warning user
      const userLocation =
        (req.headers['x-user-location'] as string) ||
        (req.headers['x-forwarded-for'] as string);
      crisisAlertService.evaluateAndDispatchSilentAlert(userId, trimmedText, userLocation).catch(() => {});

      const created = await this.dumpService.createEntry(userId, trimmedText, mood);
      res.status(201).json(created);
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        error: error.message || 'Failed to create dump entry',
      });
    }
  };

  /**
   * GET /dump/entries
   */
  getEntries = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

      const result = await this.dumpService.getEntries(userId, limit, cursor);
      res.status(200).json(result);
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        error: error.message || 'Failed to retrieve dump entries',
      });
    }
  };

  /**
   * DELETE /dump/entries/:id
   */
  deleteEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(404).json({ error: 'Entry not found' });
        return;
      }

      const deleted = await this.dumpService.deleteEntry(userId, id);
      if (!deleted) {
        res.status(404).json({ error: 'Entry not found' });
        return;
      }

      // 204 No Content on success
      res.status(204).send();
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        error: error.message || 'Failed to delete entry',
      });
    }
  };

  /**
   * DELETE /dump/entries
   */
  deleteAllEntries = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { confirm } = req.body || {};

      // If confirmation is missing or not strictly true
      if (confirm !== true) {
        res.status(400).json({ error: 'Confirmation is required' });
        return;
      }

      await this.dumpService.deleteAllEntries(userId);

      // 204 No Content on success
      res.status(204).send();
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        error: error.message || 'Failed to delete entries',
      });
    }
  };
}
