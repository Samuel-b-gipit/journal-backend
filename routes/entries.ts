import { Router } from 'express';
import { body } from 'express-validator';
import { getEntries, getEntryByDate, upsertEntry, deleteEntry } from '../controllers/entries';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getEntries);
router.get('/date/:date', getEntryByDate);

router.put('/', [
  body('date').isISO8601().withMessage('Date must be YYYY-MM-DD'),
  body('content').notEmpty().withMessage('Content is required'),
  body('mood').optional().isInt({ min: 1, max: 5 }).withMessage('Mood must be 1–5'),
  body('habitLogs').optional().isArray(),
  body('habitLogs.*.habitId').optional().isUUID(),
], upsertEntry);

router.delete('/:id', deleteEntry);

export default router;
