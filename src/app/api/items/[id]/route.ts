import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/items/[id]">) {
  const { id } = await ctx.params;
  const result = await db.execute({
    sql: "SELECT * FROM items WHERE id = ?",
    args: [id],
  });
  if (!result.rows[0]) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(result.rows[0]);
}

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/items/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json();

  if (!body.name || !body.description) {
    return Response.json(
      { error: "name and description are required" },
      { status: 400 }
    );
  }

  const result = await db.execute({
    sql: `UPDATE items
          SET name = ?, description = ?, status = ?, amount = ?
          WHERE id = ?
          RETURNING *`,
    args: [body.name, body.description, body.status ?? "active", body.amount ?? 0, id],
  });

  if (!result.rows[0]) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(result.rows[0]);
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/items/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json();

  const fields = Object.entries(body)
    .filter(([k]) => ["name", "description", "status", "amount"].includes(k))
    .map(([k]) => `${k} = ?`);

  if (!fields.length) {
    return Response.json({ error: "no valid fields to update" }, { status: 400 });
  }

  const values = Object.entries(body)
    .filter(([k]) => ["name", "description", "status", "amount"].includes(k))
    .map(([, v]) => v);

  if (!values.every((value): value is string | number | null =>
    value === null || typeof value === "string" ||
    (typeof value === "number" && Number.isFinite(value))
  )) {
    return Response.json({ error: "fields must contain text, numbers, or null" }, { status: 400 });
  }

  const result = await db.execute({
    sql: `UPDATE items SET ${fields.join(", ")} WHERE id = ? RETURNING *`,
    args: [...values, id],
  });

  if (!result.rows[0]) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(result.rows[0]);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/items/[id]">) {
  const { id } = await ctx.params;
  const result = await db.execute({
    sql: "DELETE FROM items WHERE id = ? RETURNING id",
    args: [id],
  });
  if (!result.rows[0]) return Response.json({ error: "not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
