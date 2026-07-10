// src/broadcast/services/websocket.service.ts
// Thin accessor around the live Socket.io instance so REST-layer code
// (broadcast.service.ts) can emit real-time events without importing the
// socket server bootstrap (which owns connection/auth/room-join wiring).
import type { Namespace } from 'socket.io';
import { logger } from '../../config/logger';

let nsp: Namespace | null = null;

export function setIoInstance(instance: Namespace): void {
  nsp = instance;
}

export function gymRoom(gymId: string): string {
  return `gym:${gymId}`;
}

export function emitToGym(gymId: string, event: string, payload: unknown): void {
  if (!nsp) {
    logger.warn({ gymId, event }, 'socket.io not initialized, skipping emit');
    return;
  }
  nsp.to(gymRoom(gymId)).emit(event, payload);
}

export function getActiveConnectionCount(): number {
  return nsp?.sockets.size ?? 0;
}
