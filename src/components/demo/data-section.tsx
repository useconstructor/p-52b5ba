"use client";

import { Section } from "./section";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";

const invoices = [
  { id: "INV-001", status: "Pagado", method: "Tarjeta", amount: "$250.00" },
  { id: "INV-002", status: "Pendiente", method: "PayPal", amount: "$150.00" },
  { id: "INV-003", status: "Sin pagar", method: "Transferencia", amount: "$350.00" },
  { id: "INV-004", status: "Pagado", method: "Tarjeta", amount: "$450.00" },
  { id: "INV-005", status: "Pagado", method: "PayPal", amount: "$550.00" },
];

const chartData = [
  { mes: "Ene", ventas: 186, visitas: 80 },
  { mes: "Feb", ventas: 305, visitas: 200 },
  { mes: "Mar", ventas: 237, visitas: 120 },
  { mes: "Abr", ventas: 73, visitas: 190 },
  { mes: "May", ventas: 209, visitas: 130 },
  { mes: "Jun", ventas: 214, visitas: 140 },
];

const chartConfig = {
  ventas: { label: "Ventas", color: "var(--color-chart-1)" },
  visitas: { label: "Visitas", color: "var(--color-chart-2)" },
};

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  Pagado: "default",
  Pendiente: "secondary",
  "Sin pagar": "destructive",
};

const notifications = [
  "Nuevo usuario registrado: carlos@email.com",
  "Pago recibido de #INV-001 por $250",
  "Servidor reiniciado exitosamente",
  "Build completado: rama main",
  "Backup automático finalizado",
  "Certificado SSL renovado",
  "Nueva integración activada: Slack",
  "Reporte mensual generado",
];

export function DataSection() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Section title="Datos">
      <div className="space-y-8">
        {/* Charts */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Charts</p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm font-medium">Bar Chart — Ventas vs Visitas</p>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="mes"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="ventas" fill="var(--color-ventas)" radius={4} />
                  <Bar dataKey="visitas" fill="var(--color-visitas)" radius={4} />
                </BarChart>
              </ChartContainer>
            </div>
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm font-medium">Line Chart — Tendencia</p>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <LineChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="mes"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="ventas"
                    stroke="var(--color-ventas)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="visitas"
                    stroke="var(--color-visitas)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </div>
        </div>

        <Separator />

        {/* Table */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Table</p>
          <Table>
            <TableCaption>Últimas facturas del mes.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Factura</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm">{inv.id}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[inv.status]}>{inv.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{inv.method}</TableCell>
                  <TableCell className="text-right font-medium">{inv.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Separator />

        {/* Calendar + ScrollArea */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Calendar</p>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-lg border w-fit"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Scroll Area</p>
            <ScrollArea className="h-[250px] rounded-lg border p-4">
              <div className="space-y-3">
                {notifications.map((note, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">{note}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </Section>
  );
}
