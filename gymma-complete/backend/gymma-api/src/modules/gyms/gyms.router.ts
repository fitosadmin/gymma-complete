// src/modules/gyms/gyms.router.ts
import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { listGymsQuery, gymSlugParam } from './gyms.schema';
import * as controller from './gyms.controller';
import { listReviewsQuery } from '../reviews/reviews.schema';
import * as reviewsController from '../reviews/reviews.controller';

export const gymsRouter = Router();

gymsRouter.get('/', validate({ query: listGymsQuery }), controller.listGyms);

gymsRouter.get('/:slug', validate({ params: gymSlugParam }), controller.getGymBySlug);

gymsRouter.get(
  '/:slug/reviews',
  validate({ params: gymSlugParam, query: listReviewsQuery }),
  reviewsController.listForGym,
);
