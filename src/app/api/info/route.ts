export const runtime = "nodejs";

export function GET() {
  return Response.json({
    nombre: "Notas de Bolsillo",
    descripcion: "App ficticia de Esteban para probar Constructor.",
  }, { headers: { "X-Content-Type-Options": "nosniff" } });
}
