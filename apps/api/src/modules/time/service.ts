import {
  findOpenSession,
  getProject,
  getTask,
  insertSession,
  closeSession,
  insertTimeEntry
} from './repository.js';
import type { StartTaskInput, StopTaskInput, ManualDurationInput, ManualRangeInput } from './types.js';

function badRequest(message: string, statusCode = 400) {
  const err = new Error(message) as Error & { statusCode?: number };
  err.statusCode = statusCode;
  return err;
}

function ensureProjectTask(projectId: string, taskId: string) {
  const project = getProject(projectId);
  if (!project || project.is_active !== 1) throw badRequest('Projeto inválido/inativo', 404);

  const task = getTask(taskId);
  if (!task || task.is_active !== 1) throw badRequest('Tarefa inválida/inativa', 404);
  if (task.project_id !== projectId) throw badRequest('Tarefa não pertence ao projeto', 400);

  return { project, task };
}

export function startTask(input: StartTaskInput) {
  ensureProjectTask(input.projectId, input.taskId);

  const open = findOpenSession(input.userId);
  if (open) throw badRequest('Já existe tarefa ativa. Finalize antes de iniciar outra.', 409);

  const session = insertSession(input);
  return {
    sessionId: session.id,
    startedAt: session.startedAt,
    projectId: input.projectId,
    taskId: input.taskId
  };
}

export function stopActiveTask(input: StopTaskInput) {
  const open = findOpenSession(input.userId);
  if (!open) throw badRequest('Nenhuma tarefa ativa para finalizar.', 404);

  const closed = closeSession(open.id, input.note);
  if (!closed) throw badRequest('Falha ao finalizar sessão', 500);

  const durationSeconds = Number(closed.duration_seconds ?? 0);
  const entry = insertTimeEntry({
    userId: input.userId,
    projectId: closed.project_id,
    taskId: closed.task_id,
    sessionId: closed.id,
    entryType: 'session',
    startedAt: closed.started_at,
    endedAt: closed.ended_at,
    durationSeconds,
    source: input.source,
    note: input.note
  });

  return {
    sessionId: closed.id,
    entryId: entry.id,
    startedAt: closed.started_at,
    endedAt: closed.ended_at,
    durationSeconds,
    projectId: closed.project_id,
    taskId: closed.task_id
  };
}

export function manualDuration(input: ManualDurationInput) {
  ensureProjectTask(input.projectId, input.taskId);
  if (!Number.isFinite(input.durationSeconds) || input.durationSeconds <= 0) {
    throw badRequest('durationSeconds deve ser > 0', 400);
  }

  const entry = insertTimeEntry({
    userId: input.userId,
    projectId: input.projectId,
    taskId: input.taskId,
    entryType: 'manual_duration',
    durationSeconds: Math.round(input.durationSeconds),
    source: input.source,
    note: input.note
  });

  return { entryId: entry.id, durationSeconds: Math.round(input.durationSeconds) };
}

export function manualRange(input: ManualRangeInput) {
  ensureProjectTask(input.projectId, input.taskId);

  const startedMs = new Date(input.startedAt).getTime();
  const endedMs = new Date(input.endedAt).getTime();
  if (!Number.isFinite(startedMs) || !Number.isFinite(endedMs) || endedMs <= startedMs) {
    throw badRequest('Intervalo inválido: endedAt deve ser maior que startedAt', 400);
  }

  const durationSeconds = Math.round((endedMs - startedMs) / 1000);
  const entry = insertTimeEntry({
    userId: input.userId,
    projectId: input.projectId,
    taskId: input.taskId,
    entryType: 'manual_range',
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    durationSeconds,
    source: input.source,
    note: input.note
  });

  return { entryId: entry.id, durationSeconds };
}

export function getActiveTask(userId: string) {
  const open = findOpenSession(userId);
  if (!open) return null;
  return {
    sessionId: open.id,
    projectId: open.project_id,
    projectName: open.projectName,
    taskId: open.task_id,
    taskName: open.taskName,
    startedAt: open.started_at,
    note: open.note
  };
}
