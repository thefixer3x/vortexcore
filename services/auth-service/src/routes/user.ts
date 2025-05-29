import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

// Get user profile (duplicate of auth/profile for legacy support)
router.get('/profile', asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Use /api/auth/profile endpoint',
  });
}));

// Update user profile
router.put('/profile', asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Profile update endpoint - To be implemented',
  });
}));

// Get user sessions
router.get('/sessions', asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'User sessions endpoint - To be implemented',
  });
}));

// Revoke user session
router.delete('/sessions/:sessionId', asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Session revoke endpoint - To be implemented',
  });
}));

export default router;
