import { db } from '@/lib/db';
import { ensureSchema } from '@/lib/schema';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  const body = await req.json();

  const result = await db.execute({
    sql: `UPDATE posts SET
            title = COALESCE(?, title),
            body = COALESCE(?, body),
            author = COALESCE(?, author),
            published = COALESCE(?, published)
          WHERE id = ? RETURNING *`,
    args: [body.title ?? null, body.body ?? null, body.author ?? null, body.published != null ? (body.published ? 1 : 0) : null, id],
  });

  if (!result.rows[0]) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(result.rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  await db.execute({ sql: 'DELETE FROM posts WHERE id = ?', args: [id] });
  return new Response(null, { status: 204 });
}
