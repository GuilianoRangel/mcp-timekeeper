import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware.js';
import { getActiveTask, manualDuration, manualRange, startTask, stopActiveTask } from './service.js';
import { auditLog } from '../audit/service.js';

const startSchema = z.object({
  projectId: z.string().min(3),
  taskId: z.string().min(3),
  note: z.string().max(500).optional()
});

const stopSchema = z.object({
  note: z.string().max(500).optional()
});

const manualDurationSchema = z.object({
  projectId: z.string().min(3),
  taskId: z.string().min(3),
  durationSeconds: z.number().positive(),
  note: z.string().max(500).optional()
});

const manualRangeSchema = z.object({
  projectId: z.string().min(3),
  taskId: z.string().min(3),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  note: z.string().max(500).optional()
});

function sourceOf(request: any): 'web'|'api'|'mcp' {
  return request.auth?.source ?? 'api';
}

export async function registerTimeRoutes(app: FastifyInstance) {
  app.get('/time/active', { preHandler: [requireAuth] }, async (request) => {
    return { active: getActiveTask(request.auth!.userId) };
  });

  app.post('/time/start', { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = startSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ message: 'Invalid payload', issues: parsed.error.issues });
    try {
      const out = startTask({ userId: request.auth!.userId, source: sourceOf(request), ...parsed.data });
      auditLog({ actorId: request.auth!.actorId, actorType: request.auth!.actorType, actorUserId: request.auth!.userId, action: 'time.start', entity: 'task_sessions', entityId: out.sessionId, source: request.auth!.source, after: out });
      return reply.status(201).send(out);
    } catch (err: any) {
      return reply.status(err?.statusCode ?? 500).send({ message: err?.message ?? 'Erro ao iniciar tarefa' });
    }
  });

  app.post('/time/stop', { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = stopSchema.safeParse(request.body ?? {});
    if (!parsed.success) return reply.status(400).send({ message: 'Invalid payload', issues: parsed.error.issues });
    try {
      const out = stopActiveTask({ userId: request.auth!.userId, source: sourceOf(request), note: parsed.data.note });
      auditLog({ actorId: request.auth!.actorId, actorType: request.auth!.actorType, actorUserId: request.auth!.userId, action: 'time.stop', entity: 'task_sessions', entityId: out.sessionId, source: request.auth!.source, after: out });
      return out;
    } catch (err: any) {
      return reply.status(err?.statusCode ?? 500).send({ message: err?.message ?? 'Erro ao finalizar tarefa' });
    }
  });

  app.post('/time/manual-duration', { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = manualDurationSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ message: 'Invalid payload', issues: parsed.error.issues });
    try {
      const out = manualDuration({ userId: request.auth!.userId, source: sourceOf(request), ...parsed.data });
      auditLog({ actorId: request.auth!.actorId, actorType: request.auth!.actorType, actorUserId: request.auth!.userId, action: 'time.manual_duration', entity: 'time_entries', entityId: out.entryId, source: request.auth!.source, after: out });
      return reply.status(201).send(out);
    } catch (err: any) {
      return reply.status(err?.statusCode ?? 500).send({ message: err?.message ?? 'Erro ao lançar tempo manual' });
    }
  });

  app.post('/time/manual-range', { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = manualRangeSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ message: 'Invalid payload', issues: parsed.error.issues });
    try {
      const out = manualRange({ userId: request.auth!.userId, source: sourceOf(request), ...parsed.data });
      auditLog({ actorId: request.auth!.actorId, actorType: request.auth!.actorType, actorUserId: request.auth!.userId, action: 'time.manual_range', entity: 'time_entries', entityId: out.entryId, source: request.auth!.source, after: out });
      return reply.status(201).send(out);
    } catch (err: any) {
      return reply.status(err?.statusCode ?? 500).send({ message: err?.message ?? 'Erro ao lançar tempo manual por intervalo' });
    }
  });
}
