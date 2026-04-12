import { Router } from 'express';
import { body } from 'express-validator';
import { getHabits, createHabit, updateHabit, deleteHabit } from '../controllers/habits';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getHabits);

router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('type').isIn(['BOOLEAN', 'COUNT', 'DURATION']).withMessage('Type must be BOOLEAN, COUNT, or DURATION'),
  body('color').optional().isHexColor().withMessage('Color must be a valid hex color'),
], createHabit);

router.patch('/:id', [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('color').optional().isHexColor().withMessage('Color must be a valid hex color'),
], updateHabit);

router.delete('/:id', deleteHabit);

export default router;
