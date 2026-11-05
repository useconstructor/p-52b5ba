import { db } from '@/lib/db';
import { ensureSchema } from '@/lib/schema';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  const result = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [id] });
  if (!result.rows[0]) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(result.rows[0]);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  const body = await req.json();
  const { name, description, price, category, stock } = body;

  const result = await db.execute({
    sql: `UPDATE products SET name = COALESCE(?, name), description = COALESCE(?, description),
          price = COALESCE(?, price), category = COALESCE(?, category), stock = COALESCE(?, stock)
          WHERE id = ? RETURNING *`,
    args: [name ?? null, description ?? null, price != null ? Number(price) : null, category ?? null, stock != null ? Number(stock) : null, id],
  });

  if (!result.rows[0]) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(result.rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  await db.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [id] });
  return new Response(null, { status: 204 });
}
