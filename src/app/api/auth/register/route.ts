import { db } from '@/lib/db';
import { ensureSchema } from '@/lib/schema';
import { hashPassword, generateToken, SESSION_DURATION_MS } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  await ensureSchema();
  const body = await req.json();
  const { email, password, name } = body;

  if (!email || !password || !name) {
    return Response.json({ error: 'email, password, and name are required' }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: 'password must be at least 8 characters' }, { status: 400 });
  }

  const existing = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email.toLowerCase()] });
  if (existing.rows[0]) {
    return Response.json({ error: 'Email already registered' }, { status: 409 });
  }

  const userId = crypto.randomUUID();
  const sessionId = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  const now = new Date().toISOString();

  await db.batch(
    [
      {
        sql: 'INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)',
        args: [userId, email.toLowerCase(), hashPassword(password), name, now],
      },
      {
        sql: 'INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
        args: [sessionId, userId, expiresAt, now],
      },
    ],
    'write',
  );

  const jar = await cookies();
  jar.set('session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(Date.now() + SESSION_DURATION_MS),
  });

  return Response.json({ id: userId, email: email.toLowerCase(), name }, { status: 201 });
}
