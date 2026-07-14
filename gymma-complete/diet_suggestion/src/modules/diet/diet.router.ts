// src/modules/diet/diet.router.ts
import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import { dietLimiter } from '../../middleware/rateLimiter';
import * as controller from './diet.controller';
import { calculateBody, updateNoteBody, planParams, listQuery } from './diet.schema';

export const dietRouter = Router();

// All diet routes require a valid JWT
dietRouter.use(requireAuth);

dietRouter.post('/calculate',       dietLimiter, validate({ body: calculateBody }),                        controller.calculate);
dietRouter.get('/active',                                                                                   controller.getActivePlan);
dietRouter.get('/plans',            validate({ query: listQuery }),                                        controller.listPlans);
dietRouter.get('/plans/:id',        validate({ params: planParams }),                                      controller.getPlan);
dietRouter.put('/plans/:id/note',   validate({ params: planParams, body: updateNoteBody }),                controller.updateNote);
dietRouter.delete('/plans/:id',     validate({ params: planParams }),                                      controller.deletePlan);
