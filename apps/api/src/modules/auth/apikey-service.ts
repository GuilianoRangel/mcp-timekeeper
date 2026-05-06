import { customAlphabet } from 'nanoid';
import { db, nowIso } from '../../db/index.js';
import { hashApiKey } from './crypto.js';

const nano = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 24);

export function createApiKey(userId: string, label?: string) {
  const rawKey = `tk_${nano()}_${nano()}`;
  const keyHash = hashApiKey(rawKey);
  const id = `key_${nano()}`;
  const now = nowIso();

  db.prepare(`INSERT INTO api_keys(id, user_id, key_hash, label, is_active, created_at)
    VALUES(?, ?, ?, ?, 1, ?)`)
    .run(id, userId, keyHash, label ?? null, now);

  return { id, userId, label: label ?? null, rawKey, createdAt: now };
}

export function listApiKeys(userId: string, options?: { includeInactive?: boolean }) {
  const query = options?.includeInactive
    ? `SELECT id, user_id as userId, label, is_active as isActive, last_used_at as lastUsedAt, created_at as createdAt, revoked_at as revokedAt
       FROM api_keys WHERE user_id = ? ORDER BY created_at DESC`
    : `SELECT id, user_id as userId, label, is_active as isActive, last_used_at as lastUsedAt, created_at as createdAt, revoked_at as revokedAt
       FROM api_keys WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC`;
       
  const rows = db.prepare(query).all(userId) as any[];
  return rows.map(r => ({ ...r, isActive: !!r.isActive }));
}

export function revokeApiKey(userId: string, keyId: string) {
  const now = nowIso();
  const result = db.prepare('UPDATE api_keys SET is_active = 0, revoked_at = ? WHERE id = ? AND user_id = ? AND is_active = 1').run(now, keyId, userId);
  return result.changes > 0;
}
