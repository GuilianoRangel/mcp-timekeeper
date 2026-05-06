import { spawn } from 'node:child_process';

const PORT = 3310;
const env = { ...process.env, API_PORT: String(PORT), DATABASE_URL: 'file:/opt/data/workspace/mcp-timekeeper/apps/api/data/timekeeper.sqlite' };

const server = spawn('node', ['dist/main.js'], { cwd: new URL('..', import.meta.url).pathname, env, stdio: 'ignore' });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const req = async (path, init={}) => {
  const r = await fetch(`http://127.0.0.1:${PORT}${path}`, init);
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  return { status: r.status, body: j };
};

try {
  await wait(1200);
  const login = await req('/auth/login', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ email:'admin@timekeeper.local', password:'Admin@123456' }) });
  if (login.status !== 200) throw new Error('login falhou');
  const token = login.body.accessToken;
  const h = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

  const projects = await req('/projects', { headers: h });
  if (projects.status !== 200 || !Array.isArray(projects.body) || projects.body.length === 0) throw new Error('projects falhou');
  const projectId = projects.body[0].id;

  const createdProject = await req('/projects', { method:'POST', headers: h, body: JSON.stringify({ name: `P-${Date.now()}` }) });
  if (createdProject.status !== 201) throw new Error('project create falhou');

  const task = await req('/tasks', { method:'POST', headers: h, body: JSON.stringify({ projectId, name: `T-${Date.now()}` }) });
  if (![200,201].includes(task.status)) throw new Error('task create falhou');
  const taskId = task.body.id;

  const manual = await req('/time/manual-duration', { method:'POST', headers: h, body: JSON.stringify({ projectId, taskId, durationSeconds: 60 }) });
  if (manual.status !== 201) throw new Error('manual falhou');

  const upd = await req(`/time/entries/${manual.body.entryId}`, { method:'PUT', headers: h, body: JSON.stringify({ projectId, taskId, durationSeconds: 120 }) });
  if (upd.status !== 200) throw new Error('update entry falhou');

  const del = await req(`/time/entries/${manual.body.entryId}`, { method:'DELETE', headers: h });
  if (del.status !== 200) throw new Error('delete entry falhou');

  console.log('smoke ok');
} finally {
  server.kill('SIGTERM');
}
