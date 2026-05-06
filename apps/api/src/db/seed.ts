import { db, nowIso } from './index.js';
import { hashPassword, hashApiKey } from '../modules/auth/crypto.js';
import { customAlphabet } from 'nanoid';

const nano = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 24);

const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? 'Administrador';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@timekeeper.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123456';
const SEED_PROJECT_NAME = process.env.SEED_PROJECT_NAME ?? 'UEG';
const SEED_API_KEY_LABEL = process.env.SEED_API_KEY_LABEL ?? 'mcp-default';

function findUserByEmail(email: string) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
}

async function seed() {
  const now = nowIso();

  let admin = findUserByEmail(ADMIN_EMAIL);
  if (!admin) {
    const userId = `usr_${nano()}`;
    const passwordHash = await hashPassword(ADMIN_PASSWORD);

    db.prepare(`INSERT INTO users(id, name, email, password_hash, role, is_active, created_at, updated_at)
      VALUES(?, ?, ?, ?, 'admin', 1, ?, ?)`)
      .run(userId, ADMIN_NAME, ADMIN_EMAIL, passwordHash, now, now);

    admin = findUserByEmail(ADMIN_EMAIL);
    console.log(`Admin criado: ${ADMIN_EMAIL}`);
  } else {
    console.log(`Admin já existe: ${ADMIN_EMAIL}`);
  }

  const project = db.prepare('SELECT id FROM projects WHERE name = ?').get(SEED_PROJECT_NAME) as any;
  if (!project) {
    db.prepare(`INSERT INTO projects(id, name, description, is_active, created_by, created_at, updated_at)
      VALUES(?, ?, ?, 1, ?, ?, ?)`)
      .run(`prj_${nano()}`, SEED_PROJECT_NAME, 'Projeto inicial seed', admin.id, now, now);
    console.log(`Projeto criado: ${SEED_PROJECT_NAME}`);
  } else {
    console.log(`Projeto já existe: ${SEED_PROJECT_NAME}`);
  }

  const apiKeyExists = db.prepare('SELECT id FROM api_keys WHERE user_id = ? AND label = ? AND is_active = 1')
    .get(admin.id, SEED_API_KEY_LABEL) as any;

  if (!apiKeyExists) {
    const rawKey = `tk_${nano()}_${nano()}`;
    const keyHash = hashApiKey(rawKey);

    db.prepare(`INSERT INTO api_keys(id, user_id, key_hash, label, is_active, created_at)
      VALUES(?, ?, ?, ?, 1, ?)`)
      .run(`key_${nano()}`, admin.id, keyHash, SEED_API_KEY_LABEL, now);

    console.log(`API key criada para admin (label=${SEED_API_KEY_LABEL}).`);
    console.log('Guarde a chave abaixo em local seguro (não será exibida novamente):');
    console.log(rawKey);
  } else {
    console.log(`API key ativa já existe para admin com label=${SEED_API_KEY_LABEL}`);
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
