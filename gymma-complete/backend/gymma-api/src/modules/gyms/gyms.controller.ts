// src/modules/gyms/gyms.controller.ts
import type { Request, Response } from 'express';
import { success } from '../../shared/response/envelope';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as service from './gyms.service';
import type { ListGymsQuery } from './gyms.schema';
import type { GymListFilters } from './gyms.types';

export const listGyms = asyncHandler(async (req: Request, res: Response) => {
  const q = req.validatedQuery as ListGymsQuery;

  const filters: GymListFilters = {
    q: q.q,
    city: q.city,
    area: q.area,
    amenities: q.amenities,
    womenFriendly: q.women_friendly,
    hasParking: q.has_parking,
    isOpenNow: q.is_open_now,
    priceMin: q.price_min,
    priceMax: q.price_max,
    lat: q.lat,
    lng: q.lng,
    distanceKm: q.distance_km,
    sort: q.sort,
    page: q.page,
    limit: q.limit,
  };

  const { data, meta } = await service.listGyms(filters);
  res.json(success(data, meta));
});

export const getGymBySlug = asyncHandler(async (req: Request, res: Response) => {
  const detail = await service.getGymBySlug(req.params.slug);
  res.json(success(detail));
});
