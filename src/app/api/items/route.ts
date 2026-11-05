import { db } from "@/lib/db";

export async function GET() {
  const result = await db.execute("SELECT * FROM items ORDER BY id");
  return Response.json(result.rows);
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.name || !body.description) {
    return Response.json(
      { error: "name and description are required" },
      { status: 400 }
    );
  }

  const result = await db.execute({
    sql: `INSERT INTO items (name, description, status, amount)
          VALUES (?, ?, ?, ?)
          RETURNING *`,
    args: [
      body.name,
      body.description,
      body.status ?? "active",
      body.amount ?? 0,
    ],
  });

  return Response.json(result.rows[0], { status: 201 });
}
