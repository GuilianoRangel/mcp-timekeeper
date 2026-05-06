import { findUserByEmail } from './repository.js';
import { verifyPassword } from './crypto.js';
import { signAccessToken } from './jwt.js';

export async function login(email: string, password: string) {
  const user = findUserByEmail(email);
  if (!user) return null;

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return null;

  const token = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  });

  return {
    accessToken: token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}
