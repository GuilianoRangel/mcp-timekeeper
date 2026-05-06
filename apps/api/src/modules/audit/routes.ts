import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { db } from '../../db/index.js';

const q = z.object({
  action: z.string().optional(),
  entity: z.string().optional(),
  actorUserId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.string().optional()
});

export async function registerAuditRoutes(app: FastifyInstance) {
  app.get('/audit', { preHandler: [requireAuth, requireRole('admin')] }, async (request, reply) => {
    const parsed = q.safeParse(request.query ?? {});
    if (!parsed.success) return reply.status(400).send({ message: 'Invalid query', issues: parsed.error.issues });

    const parts: string[] = ['1=1'];
    const params: any[] = [];

    if (parsed.data.action) { parts.push('action = ?'); params.push(parsed.data.action); }
    if (parsed.data.entity) { parts.push('entity = ?'); params.push(parsed.data.entity); }
    if (parsed.data.actorUserId) { parts.push('actor_user_id = ?'); params.push(parsed.data.actorUserId); }
    if (parsed.data.from) { parts.push('date(created_at) >= date(?)'); params.push(parsed.data.from); }
    if (parsed.data.to) { parts.push('date(created_at) <= date(?)'); params.push(parsed.data.to); }

    const limit = Math.min(1000, Math.max(1, Number(parsed.data.limit ?? '200')));
    params.push(limit);

    return db.prepare(`
      SELECT id, actor_id as actorId, actor_type as actorType, actor_user_id as actorUserId,
             action, entity, entity_id as entityId, source,
             before_json as beforeJson, after_json as afterJson, meta_json as metaJson,
             created_at as createdAt
      FROM audit_logs
      WHERE ${parts.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT ?
    `).all(...params);
  });
}
