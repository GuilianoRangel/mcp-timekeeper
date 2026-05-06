import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { createUser, listUsers, deleteUser, updateUser } from './service.js';
import { auditLog } from '../audit/service.js';

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'user']).default('user'),
  weeklyGoalSeconds: z.number().int().min(3600).default(36000)
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'user']).optional(),
  weeklyGoalSeconds: z.number().int().min(3600).optional()
});

export async function registerUserRoutes(app: FastifyInstance) {
  app.get('/users', { preHandler: [requireAuth, requireRole('admin')] }, async (request) => {
    const includeInactive = (request.query as any)?.includeInactive === 'true';
    return listUsers({ includeInactive });
  });

  app.post('/users', { preHandler: [requireAuth, requireRole('admin')] }, async (request, reply) => {
    const parsed = createUserSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: 'Invalid payload', issues: parsed.error.issues });
    }

    try {
      const user = await createUser(parsed.data);
      auditLog({
        actorId: request.auth!.actorId,
        actorType: request.auth!.actorType,
        actorUserId: request.auth!.userId,
        action: 'user.create',
        entity: 'users',
        entityId: user.id,
        source: request.auth!.source,
        after: user
      });
      return reply.status(201).send(user);
    } catch (err: any) {
      return reply.status(err?.statusCode ?? 500).send({ message: err?.message ?? 'Erro ao criar usuário' });
    }
  });

  app.put('/users/:id', { preHandler: [requireAuth, requireRole('admin')] }, async (request, reply) => {
    const { id } = request.params as any;
    const parsed = updateUserSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: 'Invalid payload', issues: parsed.error.issues });
    }

    try {
      const ok = await updateUser(id, parsed.data);
      if (!ok) return reply.status(404).send({ message: 'Usuário não encontrado' });

      auditLog({
        actorId: request.auth!.actorId,
        actorType: request.auth!.actorType,
        actorUserId: request.auth!.userId,
        action: 'user.update',
        entity: 'users',
        entityId: id,
        source: request.auth!.source,
        after: parsed.data
      });

      return { success: true };
    } catch (err: any) {
      return reply.status(err?.statusCode ?? 500).send({ message: err?.message ?? 'Erro ao atualizar usuário' });
    }
  });

  app.delete('/users/:id', { preHandler: [requireAuth, requireRole('admin')] }, async (request, reply) => {
    const { id } = request.params as any;
    const ok = deleteUser(id);
    if (!ok) return reply.status(404).send({ message: 'Usuário não encontrado' });
    
    auditLog({
      actorId: request.auth!.actorId,
      actorType: request.auth!.actorType,
      actorUserId: request.auth!.userId,
      action: 'user.delete',
      entity: 'users',
      entityId: id,
      source: request.auth!.source
    });

    return { success: true };
  });
}
