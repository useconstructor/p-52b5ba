import { db } from "@/lib/db";
import { connection } from "next/server";
import { Section } from "./section";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Item = {
  id: number;
  name: string;
  description: string;
  status: string;
  amount: number;
  created_at: string;
};

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  pending: "secondary",
  inactive: "outline",
};

async function getItems(): Promise<Item[]> {
  await connection();
  const result = await db.execute("SELECT * FROM items ORDER BY id");
  return result.rows as unknown as Item[];
}

export async function ItemsSection() {
  const items = await getItems();

  return (
    <Section title="Items desde Turso">
      <Table>
        <TableCaption>
          Datos reales traídos de Turso vía <code>/api/items</code>.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead className="hidden md:table-cell">Descripción</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Monto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {item.id}
              </TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                {item.description}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant[item.status] ?? "outline"}>
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                {item.amount > 0 ? `$${Number(item.amount).toFixed(2)}` : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Section>
  );
}
