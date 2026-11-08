import { mutate } from "@/lib/server/notes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return mutate(request, "fijar", context.params);
}
