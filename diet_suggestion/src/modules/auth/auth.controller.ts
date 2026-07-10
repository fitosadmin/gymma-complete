// src/modules/auth/auth.controller.ts
import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { success } from '../../shared/response/envelope';
import * as service from './auth.service';
import type { RegisterBody, LoginBody, RefreshBody } from './auth.schema';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.register(req.body as RegisterBody);
  res.status(201).json(success(result));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.login(req.body as LoginBody);
  res.json(success(result));
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as RefreshBody;
  const result = await service.refresh(refreshToken);
  res.json(success(result));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as RefreshBody;
  await service.logout(refreshToken);
  res.json(success({ loggedOut: true }));
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await service.me(req.user!.sub);
  res.json(success(user));
});
