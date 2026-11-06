"use client";

import { useState } from "react";
import { Section } from "./section";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export function FormsSection() {
  const [slider, setSlider] = useState([40]);
  const [notifications, setNotifications] = useState(true);

  return (
    <Section title="Formularios">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* Input */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" placeholder="Escribe tu nombre..." />
          </div>

          {/* Input with error */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-destructive">
              Email (error)
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              defaultValue="correo-invalido"
              className="border-destructive focus-visible:ring-destructive"
            />
            <p className="text-xs text-destructive">Ingresa un email válido.</p>
          </div>

          {/* Textarea */}
          <div className="space-y-2">
            <Label htmlFor="bio">Descripción</Label>
            <Textarea
              id="bio"
              placeholder="Cuéntanos sobre ti..."
              rows={3}
            />
          </div>

          {/* Select */}
          <div className="space-y-2">
            <Label>Rol</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Lector</SelectItem>
                <SelectItem value="guest">Invitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Checkboxes */}
          <div className="space-y-2">
            <Label>Permisos</Label>
            <div className="space-y-2 mt-1">
              {[
                { id: "read", label: "Leer" },
                { id: "write", label: "Escribir" },
                { id: "delete", label: "Eliminar" },
              ].map(({ id, label }) => (
                <div key={id} className="flex items-center gap-2">
                  <Checkbox id={id} defaultChecked={id === "read"} />
                  <Label htmlFor={id} className="font-normal cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Radio Group */}
          <div className="space-y-2">
            <Label>Plan</Label>
            <RadioGroup defaultValue="pro" className="mt-1">
              {[
                { value: "free", label: "Free" },
                { value: "pro", label: "Pro" },
                { value: "enterprise", label: "Enterprise" },
              ].map(({ value, label }) => (
                <div key={value} className="flex items-center gap-2">
                  <RadioGroupItem value={value} id={`plan-${value}`} />
                  <Label htmlFor={`plan-${value}`} className="font-normal cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Switch */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifs">Notificaciones</Label>
              <p className="text-sm text-muted-foreground">
                Recibir alertas por email
              </p>
            </div>
            <Switch
              id="notifs"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>

          {/* Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Volumen</Label>
              <span className="text-sm text-muted-foreground tabular-nums">
                {slider[0]}%
              </span>
            </div>
            <Slider
              value={slider}
              onValueChange={(val) =>
                setSlider(Array.isArray(val) ? [...val] as number[] : [val as number])
              }
              min={0}
              max={100}
              step={1}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button>Guardar cambios</Button>
        <Button variant="outline">Cancelar</Button>
      </div>
    </Section>
  );
}
