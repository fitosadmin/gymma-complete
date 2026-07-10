// src/broadcast/types/broadcast.types.ts

export type BroadcastType = 'announcement' | 'alert' | 'update';
export type BroadcastPriority = 'low' | 'normal' | 'high';
export type BroadcastStatus = 'draft' | 'sent' | 'failed' | 'deleted';

/** Raw row shape from `broadcasts`. */
export interface BroadcastRow {
  id: string;
  gym_id: string;
  sender_id: string;
  title: string;
  message: string;
  type: BroadcastType;
  priority: BroadcastPriority;
  status: BroadcastStatus;
  sent_at: string;
  created_at: string;
  updated_at: string;
}

/** `broadcasts` joined with sender info and (optionally) the requester's receipt. */
export interface BroadcastWithSenderRow extends BroadcastRow {
  sender_name: string | null;
  is_read: boolean | null;
  total_count: string;
}

export interface BroadcastReceiptRow {
  id: string;
  broadcast_id: string;
  user_id: string;
  gym_id: string;
  is_read: boolean;
  read_at: string | null;
  delivered_at: string;
  created_at: string;
}

export interface UserDeviceRow {
  id: string;
  user_id: string;
  fcm_token: string;
  platform: 'ios' | 'android';
  device_id: string | null;
  is_active: boolean;
  last_used_at: string;
  created_at: string;
}

export interface CreateBroadcastInput {
  gymId: string;
  senderId: string;
  title: string;
  message: string;
  type: BroadcastType;
  priority: BroadcastPriority;
}

export interface CreateBroadcastResult {
  broadcast_id: string;
  status: BroadcastStatus;
  estimated_reach: number;
  sent_at: string;
}

export interface BroadcastListItem {
  id: string;
  gym_id: string;
  sender_id: string;
  sender_name: string | null;
  title: string;
  message: string;
  type: BroadcastType;
  priority: BroadcastPriority;
  status: BroadcastStatus;
  is_read: boolean;
  sent_at: string;
  created_at: string;
}

export interface BroadcastDetail extends BroadcastListItem {
  receipt_stats?: {
    total_receipts: number;
    read_count: number;
  };
}

/** Payload emitted over Socket.io on `broadcast` events and enqueued for push delivery. */
export interface BroadcastEventPayload {
  broadcast_id: string;
  gym_id: string;
  title: string;
  message: string;
  type: BroadcastType;
  priority: BroadcastPriority;
  sender_id: string;
  sent_at: string;
}
