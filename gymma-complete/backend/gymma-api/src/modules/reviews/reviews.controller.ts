// src/modules/reviews/reviews.controller.ts
import type { Request, Response } from 'express';
import { success } from '../../shared/response/envelope';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as service from './reviews.service';
import type { ListReviewsQuery } from './reviews.schema';

export const listForGym = asyncHandler(async (req: Request, res: Response) => {
  const q = req.validatedQuery as ListReviewsQuery;
  const { data, meta } = await service.listForGym({
    slug: req.params.slug,
    page: q.page,
    limit: q.limit,
    sort: q.sort,
  });
  res.json(success(data, meta));
});
