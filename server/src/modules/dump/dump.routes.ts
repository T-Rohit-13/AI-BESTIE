import { Router } from 'express';
import { DumpController } from './dump.controller';
import { requireAuth } from '../../middleware/auth';
import { dumpWriteLimiter } from '../../middleware/rateLimiter';

export function createDumpRouter(controller?: DumpController): Router {
  const router = Router();
  const dumpController = controller || new DumpController();

  // All endpoints require authentication
  router.use(requireAuth);

  // 1. Rename Dump Space
  router.put('/space-name', dumpWriteLimiter, dumpController.renameSpaceName);

  // 2. Get Dump Space Name
  router.get('/space-name', dumpController.getSpaceName);

  // 3. Create Dump Entry (Atomic transaction with users.last_dump_at update)
  router.post('/entries', dumpWriteLimiter, dumpController.createEntry);

  // 4. Get Dump Entries (Cursor pagination, newest first)
  router.get('/entries', dumpController.getEntries);

  // 5. Delete One Dump Entry (Does NOT modify last_dump_at)
  router.delete('/entries/:id', dumpWriteLimiter, dumpController.deleteEntry);

  // 6. Delete All Dump Entries (Requires confirm: true, resets last_dump_at = NULL)
  router.delete('/entries', dumpWriteLimiter, dumpController.deleteAllEntries);

  return router;
}

export const dumpRouter = createDumpRouter();
