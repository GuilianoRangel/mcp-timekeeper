import { customAlphabet } from 'nanoid';
import { db, nowIso } from '../../db/index.js';

type ActorType = 'jwt_user' | 'api_key';
type Source = 'web' | 'api' | 'mcp';

const nano = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 24);

export interface AuditInput {
  actorId: string;
  actorType: ActorType;
  actorUserId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  source: Source;
  before?: unknown;
  after?: unknown;
  meta?: unknown;
}

export function auditLog(input: AuditInput): void {
  const id = `aud_${nano()}`;
  db.prepare(`INSERT INTO audit_logs(id, actor_id, actor_type, actor_user_id, action, entity, entity_id, source, before_json, after_json, meta_json, created_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      id,
      input.actorId,
      input.actorType,
      input.actorUserId,
      input.action,
      input.entity,
      input.entityId ?? null,
      input.source,
      input.before !== undefined ? JSON.stringify(input.before) : null,
      input.after !== undefined ? JSON.stringify(input.after) : null,
      input.meta !== undefined ? JSON.stringify(input.meta) : null,
      nowIso()
    );
}
