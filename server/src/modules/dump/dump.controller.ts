import { Request, Response, NextFunction } from 'express';
import { DumpService } from './dump.service.js';
import {
  validateSpaceName,
  validateCreateEntry,
  validatePaginationQuery,
  validateDeleteAll,
} from './dump.validation.js';
import { AppError } from '../../middleware/errorHandler.js';

export class DumpController {
  constructor(private dumpService: DumpService = new DumpService()) {}

  /**
   * GET /dump/space-name
   */
  getSpaceName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const name = await this.dumpService.getSpaceName(userId);
      res.status(200).json({ name });
    } catch (err) {
      next(err);
    }
  };

  /**
   * PUT /dump/space-name
   */
  renameSpaceName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const validated = validateSpaceName(req.body);
      const name = await this.dumpService.updateSpaceName(userId, validated.name);
      res.status(200).json({ name });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /dump/entries
   */
  createEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const validated = validateCreateEntry(req.body);
      const entry = await this.dumpService.createEntry(userId, validated);
      res.status(201).json(entry);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /dump/entries
   */
  getEntries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const queryParams = validatePaginationQuery(req.query);
      const result = await this.dumpService.getEntries(userId, queryParams);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /dump/entries/:id
   */
  deleteEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      if (!id || typeof id !== 'string' || !id.trim()) {
        throw new AppError('Entry not found', 404);
      }

      await this.dumpService.deleteEntry(userId, id.trim());
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /dump/entries
   */
  deleteAllEntries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      validateDeleteAll(req.body);
      await this.dumpService.deleteAllEntries(userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
