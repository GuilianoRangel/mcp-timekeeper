import type { FastifyReply, FastifyRequest } from 'fastify';
import { verifyAccessToken } from './jwt.js';
import { findUserById, findApiKeyByHash, touchApiKeyUsage } from './repository.js';
import { hashApiKey } from './crypto.js';
import type { UserRole } from './types.js';

declare module 'fastify' {
  interface FastifyRequest {
    auth?: {
      actorType: 'jwt_user' | 'api_key';
      actorId: string;
      userId: string;
      role: UserRole;
      email: string;
      name: string;
      source: 'web' | 'api' | 'mcp';
    }
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const authz = request.headers.authorization;
  if (authz?.startsWith('Bearer ')) {
    const token = authz.slice('Bearer '.length);
    try {
      const payload = verifyAccessToken(token);
      const user = findUserById(payload.sub);
      if (!user) return reply.status(401).send({ message: 'Usuário inválido' });
      request.auth = {
        actorType: 'jwt_user',
        actorId: user.id,
        userId: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
        source: 'api'
      };
      return;
    } catch {
      return reply.status(401).send({ message: 'Token inválido' });
    }
  }

  const apiKey = request.headers['x-api-key'];
  if (typeof apiKey === 'string' && apiKey.trim().length > 0) {
    const keyHash = hashApiKey(apiKey.trim());
    const row = findApiKeyByHash(keyHash);
    if (!row) return reply.status(401).send({ message: 'API key inválida' });

    const user = findUserById(row.user_id);
    if (!user) return reply.status(401).send({ message: 'Usuário da API key inválido' });

    touchApiKeyUsage(row.id);
    request.auth = {
      actorType: 'api_key',
      actorId: row.id,
      userId: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      source: 'mcp'
    };
    return;
  }

  return reply.status(401).send({ message: 'Autenticação obrigatória' });
}

export function requireRole(role: UserRole) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.auth) return reply.status(401).send({ message: 'Não autenticado' });
    if (request.auth.role !== role) return reply.status(403).send({ message: 'Acesso negado' });
  };
}
