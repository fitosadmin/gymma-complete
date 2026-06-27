// src/shared/storage/s3.ts
import { randomUUID } from 'node:crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../../config/env';
import { AppError } from '../errors/AppError';

const configured =
  !!env.STORAGE_ENDPOINT &&
  !!env.STORAGE_ACCESS_KEY_ID &&
  !!env.STORAGE_SECRET_ACCESS_KEY &&
  !!env.STORAGE_BUCKET;

const client = configured
  ? new S3Client({
      region: 'auto',
      endpoint: env.STORAGE_ENDPOINT,
      credentials: {
        accessKeyId: env.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
      },
    })
  : null;

// Allowed image types -> validated by magic bytes, not just mimetype.
const MAGIC: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // "RIFF"
};

function detectImageType(buf: Buffer): string | null {
  for (const [type, sig] of Object.entries(MAGIC)) {
    if (sig.every((b, i) => buf[i] === b)) return type;
  }
  return null;
}

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function uploadImage(
  buffer: Buffer,
  keyPrefix: string,
): Promise<string> {
  if (!configured || !client) {
    throw new AppError(503, 'INTERNAL_ERROR', 'Media storage is not configured');
  }

  const type = detectImageType(buffer);
  if (!type) throw AppError.validation('Only JPEG, PNG, or WebP images are allowed');

  const key = `${keyPrefix}/${randomUUID()}.${EXT[type]}`;
  await client.send(
    new PutObjectCommand({
      Bucket: env.STORAGE_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: type,
    }),
  );

  return `${env.STORAGE_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
}

export const storageConfigured = configured;
