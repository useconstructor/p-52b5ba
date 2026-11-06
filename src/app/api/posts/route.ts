import { db } from '@/lib/db';
import { ensureSchema } from '@/lib/schema';

export async function GET() {
  await ensureSchema();
  const result = await db.execute('SELECT * FROM posts ORDER BY created_at DESC');
  return Response.json(result.rows);
}

export async function POST(req: Request) {
  await ensureSchema();
  const body = await req.json();
  const { title, body: postBody, author = 'Admin', published = false } = body;

  if (!title || !postBody) {
    return Response.json({ error: 'title and body are required' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const result = await db.execute({
    sql: `INSERT INTO posts (id, title, body, author, published, created_at)
          VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [id, title, postBody, author, published ? 1 : 0, new Date().toISOString()],
  });

  return Response.json(result.rows[0], { status: 201 });
}
