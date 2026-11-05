"use client";

import { Section } from "./section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Mail,
  Plus,
  Trash2,
  Download,
  ExternalLink,
} from "lucide-react";

export function ButtonsSection() {
  return (
    <Section title="Botones, Badges y Avatares">
      <div className="space-y-6">
        {/* Button variants */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Variants</p>
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
        </div>

        <Separator />

        {/* Button sizes */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Tamaños</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="lg">Large</Button>
            <Button>Default</Button>
            <Button size="sm">Small</Button>
            <Button size="icon" variant="outline">
              <Plus />
            </Button>
          </div>
        </div>

        <Separator />

        {/* With icons + states */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Con iconos y estados</p>
          <div className="flex flex-wrap gap-2">
            <Button>
              <Mail /> Enviar email
            </Button>
            <Button variant="outline">
              <Download /> Descargar
            </Button>
            <Button variant="destructive">
              <Trash2 /> Eliminar
            </Button>
            <Button variant="secondary" disabled>
              <Loader2 className="animate-spin" /> Cargando
            </Button>
            <Button variant="ghost">
              <ExternalLink /> Abrir
            </Button>
          </div>
        </div>

        <Separator />

        {/* Badges */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Badges</p>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </div>

        <Separator />

        {/* Avatars */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Avatares</p>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>AB</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            {/* Stacked avatars */}
            <div className="flex -space-x-2 ml-4">
              {["CN", "AB", "JD", "MK"].map((initials) => (
                <Avatar key={initials} className="border-2 border-background">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              ))}
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                +4
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
