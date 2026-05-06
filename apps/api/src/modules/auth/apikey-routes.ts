import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from './middleware.js';
import { createApiKey, listApiKeys, revokeApiKey } from './apikey-service.js';
import { auditLog } from '../audit/service.js';

const createSchema = z.object({
  label: z.string().min(1).max(100).optional()
});

const revokeParams = z.object({
  id: z.string().min(3)
});

export async function registerApiKeyRoutes(app: FastifyInstance) {
  app.get('/auth/api-keys', { preHandler: [requireAuth] }, async (request) => {
    const includeInactive = (request.query as any)?.includeInactive === 'true';
    return listApiKeys(request.auth!.userId, { includeInactive });
  });

  app.post('/auth/api-keys', { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = createSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ message: 'Invalid payload', issues: parsed.error.issues });
    }

    const created = createApiKey(request.auth!.userId, parsed.data.label);
    auditLog({
      actorId: request.auth!.actorId,
      actorType: request.auth!.actorType,
      actorUserId: request.auth!.userId,
      action: 'apikey.create',
      entity: 'api_keys',
      entityId: created.id,
      source: request.auth!.source,
      after: { id: created.id, userId: created.userId, label: created.label }
    });
    return reply.status(201).send(created);
  });

  app.delete('/auth/api-keys/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = revokeParams.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ message: 'Invalid params', issues: parsed.error.issues });
    }
    const ok = revokeApiKey(request.auth!.userId, parsed.data.id);
    if (!ok) return reply.status(404).send({ message: 'API key não encontrada/ativa' });

    auditLog({
      actorId: request.auth!.actorId,
      actorType: request.auth!.actorType,
      actorUserId: request.auth!.userId,
      action: 'apikey.revoke',
      entity: 'api_keys',
      entityId: parsed.data.id,
      source: request.auth!.source
    });

    return { success: true };
  });
}
