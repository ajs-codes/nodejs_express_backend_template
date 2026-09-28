import { eq } from 'drizzle-orm';
import { getDb } from '../db/client.js';
import { users, type NewUser, type User } from '../db/schema.js';

export const userRepository = {
  async findById(id: string): Promise<User | null> {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ?? null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user ?? null;
  },

  async create(data: NewUser): Promise<User> {
    const db = getDb();
    const [user] = await db.insert(users).values(data).returning();
    if (!user) {
      throw new Error('Failed to create user');
    }
    return user;
  },
};
