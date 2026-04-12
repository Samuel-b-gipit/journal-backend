import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getMe } from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('name').notEmpty().withMessage('Name is required'),
], register);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
], login);

router.get('/me', authenticate, getMe);

export default router;
