import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { listTimeEntries, reportByProject, reportByTask } from './service.js';

const qProject = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  projectId: z.string().optional(),
  userId: z.string().optional()
});

const qTask = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  taskId: z.string().optional(),
  projectId: z.string().optional(),
  userId: z.string().optional()
});

const qEntries = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  projectId: z.string().optional(),
  taskId: z.string().optional()
});

export async function registerReportRoutes(app: FastifyInstance) {
  app.get('/reports/projects', { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = qProject.safeParse(request.query ?? {});
    if (!parsed.success) return reply.status(400).send({ message: 'Invalid query', issues: parsed.error.issues });

    const isAdmin = request.auth!.role === 'admin';
    const userId = isAdmin ? parsed.data.userId : request.auth!.userId;
    return reportByProject({ ...parsed.data, userId });
  });

  app.get('/reports/tasks', { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = qTask.safeParse(request.query ?? {});
    if (!parsed.success) return reply.status(400).send({ message: 'Invalid query', issues: parsed.error.issues });

    const isAdmin = request.auth!.role === 'admin';
    const userId = isAdmin ? parsed.data.userId : request.auth!.userId;
    return reportByTask({ ...parsed.data, userId });
  });

  app.get('/time/entries', { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = qEntries.safeParse(request.query ?? {});
    if (!parsed.success) return reply.status(400).send({ message: 'Invalid query', issues: parsed.error.issues });

    return listTimeEntries({ ...parsed.data, userId: request.auth!.userId });
  });

  app.get('/admin/reports/projects', { preHandler: [requireAuth, requireRole('admin')] }, async (request, reply) => {
    const parsed = qProject.safeParse(request.query ?? {});
    if (!parsed.success) return reply.status(400).send({ message: 'Invalid query', issues: parsed.error.issues });
    return reportByProject(parsed.data);
  });

  app.get('/admin/reports/tasks', { preHandler: [requireAuth, requireRole('admin')] }, async (request, reply) => {
    const parsed = qTask.safeParse(request.query ?? {});
    if (!parsed.success) return reply.status(400).send({ message: 'Invalid query', issues: parsed.error.issues });
    return reportByTask(parsed.data);
  });
}
