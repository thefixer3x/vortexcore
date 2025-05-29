import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateLogin, validateRegister, validateRefresh } from '../validators/authValidators';

const router = Router();

// Public routes
router.post('/register', validateRegister, asyncHandler(AuthController.register));
router.post('/login', validateLogin, asyncHandler(AuthController.login));
router.post('/refresh', validateRefresh, asyncHandler(AuthController.refresh));

// Protected routes
router.post('/logout', authenticateToken, asyncHandler(AuthController.logout));
router.get('/profile', authenticateToken, asyncHandler(AuthController.profile));

export default router;
