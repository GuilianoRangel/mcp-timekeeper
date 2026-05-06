import { db } from '../../db/index.js';

function toDateOnly(v?: string): string | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

function buildDateFilter(from?: string, to?: string, prefix = '') {
  const p = prefix ? `${prefix}.` : '';
  const fromDay = toDateOnly(from);
  const toDay = toDateOnly(to);
  const parts: string[] = [`${p}deleted_at IS NULL`];
  const params: any[] = [];

  if (fromDay) {
    parts.push(`date(COALESCE(${p}started_at, ${p}created_at)) >= date(?)`);
    params.push(fromDay);
  }
  if (toDay) {
    parts.push(`date(COALESCE(${p}started_at, ${p}created_at)) <= date(?)`);
    params.push(toDay);
  }

  return { where: parts.join(' AND '), params };
}

export function reportByProject(input: { from?: string; to?: string; projectId?: string; userId?: string }) {
  const { where, params } = buildDateFilter(input.from, input.to);
  const whereParts = [where];
  const finalParams = [...params];

  if (input.projectId) {
    whereParts.push('project_id = ?');
    finalParams.push(input.projectId);
  }
  if (input.userId) {
    whereParts.push('user_id = ?');
    finalParams.push(input.userId);
  }

  const weekly = db.prepare(`
    SELECT
      project_id as projectId,
      strftime('%Y-W%W', COALESCE(started_at, created_at)) as week,
      SUM(duration_seconds) as totalSeconds
    FROM time_entries
    WHERE ${whereParts.join(' AND ')}
    GROUP BY project_id, week
    ORDER BY project_id, week
  `).all(...finalParams);

  const totals = db.prepare(`
    SELECT project_id as projectId, SUM(duration_seconds) as totalSeconds
    FROM time_entries
    WHERE ${whereParts.join(' AND ')}
    GROUP BY project_id
    ORDER BY totalSeconds DESC
  `).all(...finalParams);

  const grand = db.prepare(`
    SELECT COALESCE(SUM(duration_seconds),0) as totalSeconds
    FROM time_entries
    WHERE ${whereParts.join(' AND ')}
  `).get(...finalParams) as any;

  return {
    filter: { from: input.from ?? null, to: input.to ?? null, projectId: input.projectId ?? null, userId: input.userId ?? null },
    weekly,
    totals,
    grandTotalSeconds: Number(grand?.totalSeconds ?? 0)
  };
}

export function reportByTask(input: { from?: string; to?: string; taskId?: string; projectId?: string; userId?: string }) {
  const { where, params } = buildDateFilter(input.from, input.to);
  const whereParts = [where];
  const finalParams = [...params];

  if (input.taskId) {
    whereParts.push('task_id = ?');
    finalParams.push(input.taskId);
  }
  if (input.projectId) {
    whereParts.push('project_id = ?');
    finalParams.push(input.projectId);
  }
  if (input.userId) {
    whereParts.push('user_id = ?');
    finalParams.push(input.userId);
  }

  const weekly = db.prepare(`
    SELECT
      task_id as taskId,
      project_id as projectId,
      strftime('%Y-W%W', COALESCE(started_at, created_at)) as week,
      SUM(duration_seconds) as totalSeconds
    FROM time_entries
    WHERE ${whereParts.join(' AND ')}
    GROUP BY task_id, project_id, week
    ORDER BY task_id, week
  `).all(...finalParams);

  const totals = db.prepare(`
    SELECT task_id as taskId, project_id as projectId, SUM(duration_seconds) as totalSeconds
    FROM time_entries
    WHERE ${whereParts.join(' AND ')}
    GROUP BY task_id, project_id
    ORDER BY totalSeconds DESC
  `).all(...finalParams);

  const grand = db.prepare(`
    SELECT COALESCE(SUM(duration_seconds),0) as totalSeconds
    FROM time_entries
    WHERE ${whereParts.join(' AND ')}
  `).get(...finalParams) as any;

  return {
    filter: { from: input.from ?? null, to: input.to ?? null, taskId: input.taskId ?? null, projectId: input.projectId ?? null, userId: input.userId ?? null },
    weekly,
    totals,
    grandTotalSeconds: Number(grand?.totalSeconds ?? 0)
  };
}

export function listTimeEntries(input: { from?: string; to?: string; projectId?: string; taskId?: string; userId: string }) {
  const { where, params } = buildDateFilter(input.from, input.to, 'e');
  const whereParts = [where, 'e.user_id = ?'];
  const finalParams = [...params, input.userId];

  if (input.projectId) {
    whereParts.push('e.project_id = ?');
    finalParams.push(input.projectId);
  }
  if (input.taskId) {
    whereParts.push('e.task_id = ?');
    finalParams.push(input.taskId);
  }

  const rows = db.prepare(`
    SELECT e.id, e.project_id as projectId, e.task_id as taskId, e.entry_type as entryType,
           e.started_at as startedAt, e.ended_at as endedAt,
           e.duration_seconds as durationSeconds, e.note, e.source, e.created_at as createdAt,
           p.name as projectName, t.name as taskName
    FROM time_entries e
    JOIN projects p ON e.project_id = p.id
    JOIN tasks t ON e.task_id = t.id
    WHERE ${whereParts.join(' AND ')}
    ORDER BY COALESCE(e.started_at, e.created_at) DESC, e.created_at DESC
    LIMIT 1000
  `).all(...finalParams) as any[];

  return rows.map(r => ({
    ...r,
    project: { id: r.projectId, name: r.projectName },
    task: { id: r.taskId, name: r.taskName }
  }));
}
