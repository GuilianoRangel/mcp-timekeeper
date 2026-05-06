import { db, nowIso } from '../../db/index.js';
import { customAlphabet } from 'nanoid';

const nano = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 24);

export function getProject(projectId: string) {
  return db.prepare('SELECT id, name, is_active FROM projects WHERE id = ?').get(projectId) as any;
}

export function getTask(taskId: string) {
  return db.prepare('SELECT id, name, project_id, is_active FROM tasks WHERE id = ?').get(taskId) as any;
}

export function findOpenSession(userId: string) {
  return db.prepare(`
    SELECT s.*, p.name as projectName, t.name as taskName
    FROM task_sessions s
    JOIN projects p ON s.project_id = p.id
    JOIN tasks t ON s.task_id = t.id
    WHERE s.user_id = ? AND s.ended_at IS NULL
  `).get(userId) as any;
}

export function insertSession(input: { userId: string; projectId: string; taskId: string; source: 'web'|'api'|'mcp'; note?: string; }) {
  const id = `ses_${nano()}`;
  const now = nowIso();
  db.prepare(`INSERT INTO task_sessions(id, user_id, project_id, task_id, started_at, note, source, created_at, updated_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, input.userId, input.projectId, input.taskId, now, input.note ?? null, input.source, now, now);
  return { id, startedAt: now };
}

export function closeSession(sessionId: string, note?: string) {
  const now = nowIso();
  const session = db.prepare('SELECT * FROM task_sessions WHERE id = ?').get(sessionId) as any;
  if (!session || session.ended_at) return null;

  const started = new Date(session.started_at).getTime();
  const ended = new Date(now).getTime();
  const durationSeconds = Math.max(0, Math.round((ended - started) / 1000));

  db.prepare(`UPDATE task_sessions
    SET ended_at = ?, duration_seconds = ?, note = COALESCE(?, note), updated_at = ?
    WHERE id = ?`)
    .run(now, durationSeconds, note ?? null, now, sessionId);

  return { ...session, ended_at: now, duration_seconds: durationSeconds };
}

export function getTimeEntry(entryId: string, userId: string) {
  return db.prepare("SELECT * FROM time_entries WHERE id = ? AND user_id = ? AND deleted_at IS NULL").get(entryId, userId) as any;
}

export function updateTimeEntry(entryId: string, input: { projectId: string; taskId: string; startedAt?: string; endedAt?: string; durationSeconds: number; note?: string; }) {
  const now = nowIso();
  db.prepare(`UPDATE time_entries SET project_id=?, task_id=?, started_at=?, ended_at=?, duration_seconds=?, note=?, updated_at=? WHERE id=?`)
    .run(input.projectId, input.taskId, input.startedAt ?? null, input.endedAt ?? null, input.durationSeconds, input.note ?? null, now, entryId);
}

export function softDeleteTimeEntry(entryId: string) {
  db.prepare("UPDATE time_entries SET deleted_at = ?, updated_at = ? WHERE id = ?").run(nowIso(), nowIso(), entryId);
}

export function insertTimeEntry(input: {
  userId: string;
  projectId: string;
  taskId: string;
  sessionId?: string;
  entryType: 'session' | 'manual_duration' | 'manual_range';
  startedAt?: string;
  endedAt?: string;
  durationSeconds: number;
  source: 'web'|'api'|'mcp';
  note?: string;
}) {
  const id = `ent_${nano()}`;
  const now = nowIso();
  db.prepare(`INSERT INTO time_entries(id, user_id, project_id, task_id, session_id, entry_type, started_at, ended_at, duration_seconds, note, source, created_at, updated_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, input.userId, input.projectId, input.taskId, input.sessionId ?? null, input.entryType, input.startedAt ?? null, input.endedAt ?? null, input.durationSeconds, input.note ?? null, input.source, now, now);
  return { id, createdAt: now };
}
