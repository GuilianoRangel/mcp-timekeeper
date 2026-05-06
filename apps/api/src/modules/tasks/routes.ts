import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/middleware.js';
import { db, nowIso } from '../../db/index.js';
import { customAlphabet } from 'nanoid';
import { z } from 'zod';
import { auditLog } from '../audit/service.js';

const nano = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 24);
const createTaskSchema = z.object({
  projectId: z.string().min(3),
  name: z.string().min(2),
  description: z.string().max(1000).optional()
});

export async function registerTaskRoutes(app: FastifyInstance) {
  app.get('/tasks', { preHandler: [requireAuth] }, async (request) => {
    const projectId = (request.query as any)?.projectId as string | undefined;
    const includeInactive = (request.query as any)?.includeInactive === 'true';
    
    let query = 'SELECT id, project_id as projectId, name, description, is_active as isActive FROM tasks';
    const conditions: string[] = [];
    const params: any[] = [];

    if (projectId) {
      conditions.push('project_id = ?');
      params.push(projectId);
    }

    if (!includeInactive) {
      conditions.push('is_active = 1');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY name';

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(r => ({ ...r, isActive: !!r.isActive }));
  });

  app.post('/tasks', { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = createTaskSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ message: 'Invalid payload', issues: parsed.error.issues });

    const project = db.prepare('SELECT id, is_active FROM projects WHERE id = ?').get(parsed.data.projectId) as any;
    if (!project || project.is_active !== 1) return reply.status(404).send({ message: 'Projeto inválido/inativo' });

    const exists = db.prepare('SELECT id FROM tasks WHERE project_id = ? AND lower(name) = lower(?)').get(parsed.data.projectId, parsed.data.name) as any;
    if (exists) return reply.status(200).send({ id: exists.id, projectId: parsed.data.projectId, name: parsed.data.name, alreadyExisted: true });

    const id = `tsk_${nano()}`;
    const now = nowIso();
    db.prepare(`INSERT INTO tasks(id, project_id, name, description, is_active, created_by, created_at, updated_at)
      VALUES(?, ?, ?, ?, 1, ?, ?, ?)`)
      .run(id, parsed.data.projectId, parsed.data.name, parsed.data.description ?? null, request.auth!.userId, now, now);

    const out = { id, projectId: parsed.data.projectId, name: parsed.data.name, description: parsed.data.description ?? null };
    auditLog({ actorId: request.auth!.actorId, actorType: request.auth!.actorType, actorUserId: request.auth!.userId, action: 'task.create', entity: 'tasks', entityId: id, source: request.auth!.source, after: out });

    return reply.status(201).send(out);
  });

  app.put('/tasks/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as any;
    const parsed = z.object({
      name: z.string().min(2).optional(),
      description: z.string().max(1000).nullable().optional(),
      isActive: z.boolean().optional()
    }).passthrough().safeParse(request.body);

    if (!parsed.success) return reply.status(400).send({ message: 'Invalid payload', issues: parsed.error.issues });
    const body = parsed.data;

    const row = db.prepare('SELECT id, project_id as projectId, name, description, is_active as isActive FROM tasks WHERE id = ?').get(id) as any;
    if (!row) return reply.status(404).send({ message: 'Tarefa não encontrada' });
    const old = { ...row, isActive: !!row.isActive };

    const name = body.name ?? old.name;
    const description = body.description === undefined ? old.description : body.description;
    const isActive = body.isActive === undefined ? old.isActive : (body.isActive ? 1 : 0);

    db.prepare('UPDATE tasks SET name = ?, description = ?, is_active = ?, updated_at = ? WHERE id = ?')
      .run(name, description, isActive, nowIso(), id);

    const out = { id, projectId: old.projectId, name, description, isActive: !!isActive };
    auditLog({ actorId: request.auth!.actorId, actorType: request.auth!.actorType, actorUserId: request.auth!.userId, action: 'task.update', entity: 'tasks', entityId: id, source: request.auth!.source, before: old, after: out });
    return out;
  });

  app.delete('/tasks/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as any;
    const old = db.prepare('SELECT id, name FROM tasks WHERE id = ?').get(id) as any;
    if (!old) return reply.status(404).send({ message: 'Tarefa não encontrada' });

    db.prepare('UPDATE tasks SET is_active = 0, updated_at = ? WHERE id = ?').run(nowIso(), id);
    auditLog({ actorId: request.auth!.actorId, actorType: request.auth!.actorType, actorUserId: request.auth!.userId, action: 'task.delete', entity: 'tasks', entityId: id, source: request.auth!.source, before: old, after: { ...old, isActive: false } });
    return { success: true };
  });
}
