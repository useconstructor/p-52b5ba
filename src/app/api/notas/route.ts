import { listNotes, mutate } from "@/lib/server/notes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = listNotes;
export function POST(request: Request) {
  return mutate(request, "crear");
}
