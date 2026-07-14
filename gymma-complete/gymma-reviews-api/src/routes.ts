// src/routes.ts
import { Router } from 'express';
import { gymmaRouter } from './modules/gymma/gymma.router';

export const apiRouter = Router();

// Mount all gymma endpoints (public, owner, admin) at the root of the API
apiRouter.use('/', gymmaRouter);
