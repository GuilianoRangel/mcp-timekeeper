import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { login } from './service.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post('/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: 'Invalid payload', issues: parsed.error.issues });
    }

    const result = await login(parsed.data.email, parsed.data.password);
    if (!result) {
      return reply.status(401).send({ message: 'Credenciais inválidas' });
    }

    return result;
  });
}
