import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  const jar = await cookies();
  const token = jar.get('session')?.value;
  if (!token) return Response.json({ user: null });

  const result = await db.execute({
    sql: `SELECT u.id, u.email, u.name, u.created_at
          FROM sessions s JOIN users u ON u.id = s.user_id
          WHERE s.id = ? AND s.expires_at > ?`,
    args: [token, new Date().toISOString()],
  });

  if (!result.rows[0]) return Response.json({ user: null });
  return Response.json({ user: result.rows[0] });
}
