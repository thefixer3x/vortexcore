import { Application } from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import mfaRoutes from './mfa';
import healthRoutes from './health';

export const setupRoutes = (app: Application): void => {
  // API version prefix
  const apiPrefix = '/api/v1';

  // Mount routes
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/user`, userRoutes);
  app.use(`${apiPrefix}/mfa`, mfaRoutes);
  app.use(`${apiPrefix}/health`, healthRoutes);

  // Legacy support (without version)
  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/mfa', mfaRoutes);
};
