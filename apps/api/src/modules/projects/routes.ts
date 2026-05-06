import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware.js';
import { db, nowIso } from '../../db/index.js';
import { customAlphabet } from 'nanoid';
import { auditLog } from '../audit/service.js';

const nano = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 24);

const createSchema = z.object({ name: z.string().min(2), description: z.string().max(1000).optional() });
const updateSchema = z.object({ name: z.string().min(2).optional(), description: z.string().max(1000).nullable().optional(), isActive: z.boolean().optional() });
const idSchema = z.object({ id: z.string().min(3) });

export async function registerProjectRoutes(app: FastifyInstance) {
  app.get('/projects', { preHandler: [requireAuth] }, async (request) => {
    const includeInactive = (request.query as any)?.includeInactive === 'true';
    const query = includeInactive 
      ? 'SELECT id, name, description, is_active as isActive FROM projects ORDER BY name'
      : 'SELECT id, name, description, is_active as isActive FROM projects WHERE is_active = 1 ORDER BY name';
    const rows = db.prepare(query).all() as any[];
    return rows.map(r => ({ ...r, isActive: !!r.isActive }));
  });

  app.post('/projects', { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ message: 'Invalid payload', issues: parsed.error.issues });

    const exists = db.prepare('SELECT id FROM projects WHERE lower(name)=lower(?)').get(parsed.data.name) as any;
    if (exists) return reply.status(409).send({ message: 'Projeto já existe' });

    const id = `prj_${nano()}`;
    const now = nowIso();
    db.prepare('INSERT INTO projects(id, name, description, is_active, created_by, created_at, updated_at) VALUES(?, ?, ?, 1, ?, ?, ?)')
      .run(id, parsed.data.name, parsed.data.description ?? null, request.auth!.userId, now, now);

    const out = { id, name: parsed.data.name, description: parsed.data.description ?? null, isActive: true };
    auditLog({ actorId: request.auth!.actorId, actorType: request.auth!.actorType, actorUserId: request.auth!.userId, action: 'project.create', entity: 'projects', entityId: id, source: request.auth!.source, after: out });
    return reply.status(201).send(out);
  });

  app.put('/projects/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const pId = idSchema.safeParse(request.params);
    const body = updateSchema.safeParse(request.body ?? {});
    if (!pId.success || !body.success) return reply.status(400).send({ message: 'Invalid payload/params' });

    const row = db.prepare('SELECT id, name, description, is_active as isActive FROM projects WHERE id = ?').get(pId.data.id) as any;
    if (!row) return reply.status(404).send({ message: 'Projeto não encontrado' });
    const old = { ...row, isActive: !!row.isActive };

    const name = body.data.name ?? old.name;
    const description = body.data.description === undefined ? old.description : body.data.description;
    const isActive = body.data.isActive === undefined ? old.isActive : (body.data.isActive ? 1 : 0);

    db.prepare('UPDATE projects SET name = ?, description = ?, is_active = ?, updated_at = ? WHERE id = ?')
      .run(name, description, isActive, nowIso(), pId.data.id);

    const out = { id: pId.data.id, name, description, isActive: !!isActive };
    auditLog({ actorId: request.auth!.actorId, actorType: request.auth!.actorType, actorUserId: request.auth!.userId, action: 'project.update', entity: 'projects', entityId: pId.data.id, source: request.auth!.source, before: old, after: out });
    return out;
  });

  app.delete('/projects/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const pId = idSchema.safeParse(request.params);
    if (!pId.success) return reply.status(400).send({ message: 'Invalid params' });

    const old = db.prepare('SELECT id, name, description, is_active as isActive FROM projects WHERE id = ?').get(pId.data.id) as any;
    if (!old) return reply.status(404).send({ message: 'Projeto não encontrado' });

    db.prepare('UPDATE projects SET is_active = 0, updated_at = ? WHERE id = ?').run(nowIso(), pId.data.id);
    auditLog({ actorId: request.auth!.actorId, actorType: request.auth!.actorType, actorUserId: request.auth!.userId, action: 'project.delete', entity: 'projects', entityId: pId.data.id, source: request.auth!.source, before: old, after: { ...old, isActive: false } });
    return { success: true };
  });
}
