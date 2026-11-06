import { db } from '@/lib/db';
import { ensureSchema } from '@/lib/schema';
import { verifyPassword, generateToken, SESSION_DURATION_MS } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  await ensureSchema();
  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    return Response.json({ error: 'email and password are required' }, { status: 400 });
  }

  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [email.toLowerCase()],
  });
  const user = result.rows[0] as unknown as { id: string; email: string; name: string; password_hash: string } | undefined;

  if (!user || !verifyPassword(password, user.password_hash)) {
    return Response.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const sessionId = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  await db.execute({
    sql: 'INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
    args: [sessionId, user.id, expiresAt, new Date().toISOString()],
  });

  const jar = await cookies();
  jar.set('session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(Date.now() + SESSION_DURATION_MS),
  });

  return Response.json({ id: user.id, email: user.email, name: user.name });
}
