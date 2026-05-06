import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware.js';
import { auditLog } from '../audit/service.js';
import { env } from '../../config/env.js';
import { getProject, getTask, getTimeEntry, softDeleteTimeEntry, updateTimeEntry } from './repository.js';

const idParam = z.object({ id: z.string().min(3) });
const updateSchema = z.object({
  projectId: z.string().min(3),
  taskId: z.string().min(3),
  startedAt: z.string().datetime().optional().nullable(),
  endedAt: z.string().datetime().optional().nullable(),
  durationSeconds: z.number().positive().optional(),
  note: z.string().max(500).optional().nullable()
});

function ensureWithinEditWindow(createdAt: string) {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const maxAgeMs = env.editWindowDays * 24 * 60 * 60 * 1000;
  if ((now - created) > maxAgeMs) {
    const err = new Error(`Janela de edição expirada (>${env.editWindowDays} dias)`) as Error & { statusCode?: number };
    err.statusCode = 403;
    throw err;
  }
}

export async function registerTimeEntryRoutes(app: FastifyInstance) {
  app.put('/time/entries/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const p = idParam.safeParse(request.params);
    const b = updateSchema.safeParse(request.body);
    if (!p.success || !b.success) return reply.status(400).send({ message: 'Invalid payload/params' });

    const old = getTimeEntry(p.data.id, request.auth!.userId);
    if (!old) return reply.status(404).send({ message: 'Entrada não encontrada' });

    try {
      ensureWithinEditWindow(old.created_at);
    } catch (err: any) {
      return reply.status(err?.statusCode ?? 403).send({ message: err?.message });
    }

    const project = getProject(b.data.projectId);
    const task = getTask(b.data.taskId);
    if (!project || project.is_active !== 1) return reply.status(404).send({ message: 'Projeto inválido/inativo' });
    if (!task || task.is_active !== 1 || task.project_id !== b.data.projectId) return reply.status(404).send({ message: 'Tarefa inválida/inativa ou fora do projeto' });

    let startedAt = b.data.startedAt ?? old.started_at;
    let endedAt = b.data.endedAt ?? old.ended_at;
    let durationSeconds = b.data.durationSeconds ?? old.duration_seconds;

    if (startedAt && endedAt && !b.data.durationSeconds) {
      const s = new Date(startedAt).getTime();
      const e = new Date(endedAt).getTime();
      if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return reply.status(400).send({ message: 'Intervalo inválido' });
      durationSeconds = Math.round((e - s) / 1000);
    }

    updateTimeEntry(p.data.id, {
      projectId: b.data.projectId,
      taskId: b.data.taskId,
      startedAt: startedAt ?? undefined,
      endedAt: endedAt ?? undefined,
      durationSeconds,
      note: b.data.note ?? old.note
    });

    const after = getTimeEntry(p.data.id, request.auth!.userId);
    auditLog({ actorId: request.auth!.actorId, actorType: request.auth!.actorType, actorUserId: request.auth!.userId, action: 'time.entry.update', entity: 'time_entries', entityId: p.data.id, source: request.auth!.source, before: old, after });

    return { success: true, entry: after };
  });

  app.delete('/time/entries/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const p = idParam.safeParse(request.params);
    if (!p.success) return reply.status(400).send({ message: 'Invalid params' });

    const old = getTimeEntry(p.data.id, request.auth!.userId);
    if (!old) return reply.status(404).send({ message: 'Entrada não encontrada' });

    try {
      ensureWithinEditWindow(old.created_at);
    } catch (err: any) {
      return reply.status(err?.statusCode ?? 403).send({ message: err?.message });
    }

    softDeleteTimeEntry(p.data.id);
    auditLog({ actorId: request.auth!.actorId, actorType: request.auth!.actorType, actorUserId: request.auth!.userId, action: 'time.entry.delete', entity: 'time_entries', entityId: p.data.id, source: request.auth!.source, before: old, after: { deleted: true } });

    return { success: true };
  });
}
