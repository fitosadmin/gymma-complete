// src/modules/auth/auth.controller.ts
import type { Request, Response } from 'express';
import { success } from '../../shared/response/envelope';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as service from './auth.service';
import type {
  RegisterBody,
  LoginBody,
  GoogleBody,
  RefreshBody,
  ForgotPasswordBody,
  ResetPasswordBody,
} from './auth.schema';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.register(req.body as RegisterBody);
  res.status(201).json(success(result));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.login(req.body as LoginBody);
  res.json(success(result));
});

export const google = asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body as GoogleBody;
  const result = await service.loginWithGoogle(idToken);
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

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as ForgotPasswordBody;
  await service.forgotPassword(email);
  // always 200 regardless of whether the email exists
  res.json(success({ sent: true }));
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body as ResetPasswordBody;
  await service.resetPassword(token, newPassword);
  res.json(success({ reset: true }));
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await service.me(req.user!.id);
  res.json(success(user));
});
