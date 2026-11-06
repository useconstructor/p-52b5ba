import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST() {
  const jar = await cookies();
  const token = jar.get('session')?.value;

  if (token) {
    await db.execute({ sql: 'DELETE FROM sessions WHERE id = ?', args: [token] }).catch(() => {});
    jar.delete('session');
  }

  return Response.json({ ok: true });
}
