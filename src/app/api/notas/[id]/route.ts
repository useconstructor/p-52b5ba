import { detail } from "@/lib/server/notes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return detail(request, context.params);
}
