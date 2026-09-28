import { hashPassword } from '../../src/auth/password.js';
import { userRepository } from '../../src/repositories/user.repository.js';
import type { User } from '../../src/db/schema.js';

type CreateUserOverrides = Partial<{
  email: string;
  name: string;
  password: string;
  emailVerified: boolean;
}>;

export async function createUser(overrides: CreateUserOverrides = {}): Promise<User> {
  const password = overrides.password ?? 'Password123!';
  const passwordHash = await hashPassword(password);

  return userRepository.create({
    email: overrides.email ?? `user-${Date.now()}@example.com`,
    name: overrides.name ?? 'Test User',
    passwordHash,
    emailVerified: overrides.emailVerified ?? true,
  });
}

export async function createAuthenticatedUser(
  overrides: CreateUserOverrides = {},
): Promise<{ user: User; password: string }> {
  const password = overrides.password ?? 'Password123!';
  const user = await createUser({ ...overrides, password });
  return { user, password };
}
