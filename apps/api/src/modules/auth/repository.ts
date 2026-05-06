import { db, nowIso } from '../../db/index.js';

export interface DbUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'user';
  is_active: number;
}

export interface DbApiKey {
  id: string;
  user_id: string;
  key_hash: string;
  label: string | null;
  is_active: number;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

export function findUserByEmail(email: string): DbUser | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email) as DbUser | undefined;
}

export function findUserById(id: string): DbUser | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(id) as DbUser | undefined;
}

export function findApiKeyByHash(keyHash: string): DbApiKey | undefined {
  return db.prepare('SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1').get(keyHash) as DbApiKey | undefined;
}

export function touchApiKeyUsage(id: string): void {
  db.prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?').run(nowIso(), id);
}
