import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerAuthRoutes } from './modules/auth/routes.js';
import { registerApiKeyRoutes } from './modules/auth/apikey-routes.js';
import { registerUserRoutes } from './modules/users/routes.js';
import { registerProjectRoutes } from './modules/projects/routes.js';
import { registerTaskRoutes } from './modules/tasks/routes.js';
import { registerTimeRoutes } from './modules/time/routes.js';
import { registerReportRoutes } from './modules/reports/routes.js';
import { registerAuditRoutes } from './modules/audit/routes.js';
import { registerTimeEntryRoutes } from './modules/time/entry-routes.js';

async function bootstrap() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['content-type', 'authorization', 'x-api-key']
  });

  app.get('/health', async () => ({ status: 'ok', service: 'api' }));
  await registerAuthRoutes(app);
  await registerApiKeyRoutes(app);
  await registerUserRoutes(app);
  await registerProjectRoutes(app);
  await registerTaskRoutes(app);
  await registerTimeRoutes(app);
  await registerReportRoutes(app);
  await registerAuditRoutes(app);
  await registerTimeEntryRoutes(app);

  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen({ port, host: '0.0.0.0' });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
