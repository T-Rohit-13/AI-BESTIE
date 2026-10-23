import { Router } from 'express';
import { DumpController } from './dump.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { dumpWriteRateLimiter } from '../../middleware/rateLimiter.js';

export function createDumpRouter(controller: DumpController = new DumpController()): Router {
  const router = Router();

  // All Dump Mode endpoints require authentication via req.user.id
  router.use(requireAuth);

  // 1 & 2: Dump Space Name
  router.get('/space-name', controller.getSpaceName);
  router.put('/space-name', dumpWriteRateLimiter, controller.renameSpaceName);

  // 3 & 4: Dump Entries Collection
  router.get('/entries', controller.getEntries);
  router.post('/entries', dumpWriteRateLimiter, controller.createEntry);
  router.delete('/entries', dumpWriteRateLimiter, controller.deleteAllEntries);

  // 5: Single Dump Entry
  router.delete('/entries/:id', dumpWriteRateLimiter, controller.deleteEntry);

  return router;
}

export const dumpRouter = createDumpRouter();
export default dumpRouter;
