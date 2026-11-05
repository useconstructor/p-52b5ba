import { db } from '@/lib/db';
import { ensureSchema } from '@/lib/schema';

export async function GET() {
  await ensureSchema();
  const result = await db.execute('SELECT * FROM products ORDER BY created_at DESC');
  return Response.json(result.rows);
}

export async function POST(req: Request) {
  await ensureSchema();
  const body = await req.json();
  const { name, description = '', price = 0, category = '', stock = 0 } = body;

  if (!name || typeof name !== 'string') {
    return Response.json({ error: 'name is required' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const result = await db.execute({
    sql: `INSERT INTO products (id, name, description, price, category, stock, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [id, name, description, Number(price), category, Number(stock), new Date().toISOString()],
  });

  return Response.json(result.rows[0], { status: 201 });
}
