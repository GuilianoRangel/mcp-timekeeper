import { customAlphabet } from 'nanoid';
import { db, nowIso } from '../../db/index.js';
import { hashPassword } from '../auth/crypto.js';

const nano = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 24);

type Role = 'admin' | 'user';

export async function createUser(input: { name: string; email: string; password: string; role: Role }) {
  const now = nowIso();

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(input.email) as { id: string } | undefined;
  if (exists) {
    const err = new Error('E-mail já cadastrado');
    (err as any).statusCode = 409;
    throw err;
  }

  const id = `usr_${nano()}`;
  const passwordHash = await hashPassword(input.password);

  db.prepare(`INSERT INTO users(id, name, email, password_hash, role, is_active, created_at, updated_at)
    VALUES(?, ?, ?, ?, ?, 1, ?, ?)`)
    .run(id, input.name, input.email, passwordHash, input.role, now, now);

  return { id, name: input.name, email: input.email, role: input.role };
}

export function listUsers(options?: { includeInactive?: boolean }) {
  const query = options?.includeInactive
    ? 'SELECT id, name, email, role, is_active as isActive, created_at as createdAt FROM users ORDER BY created_at DESC'
    : 'SELECT id, name, email, role, is_active as isActive, created_at as createdAt FROM users WHERE is_active = 1 ORDER BY created_at DESC';
  
  const rows = db.prepare(query).all() as any[];
  return rows.map(r => ({ ...r, isActive: !!r.isActive }));
}

export function deleteUser(id: string) {
  const now = nowIso();
  const result = db.prepare('UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?').run(now, id);
  return result.changes > 0;
}
