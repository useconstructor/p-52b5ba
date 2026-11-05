"use client";

import { Section } from "./section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, ChevronDown, Settings, LogOut, User } from "lucide-react";

export function OverlaysSection() {
  return (
    <Section title="Overlays y menús">
      <div className="flex flex-wrap gap-3">
        {/* Dialog */}
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>
            Dialog
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar perfil</DialogTitle>
              <DialogDescription>
                Realiza cambios en tu perfil. Haz clic en guardar cuando termines.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Nombre</Label>
                <Input defaultValue="Juan García" />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input defaultValue="juan@example.com" type="email" />
              </div>
            </div>
            <DialogFooter>
              <Button>Guardar cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Alert Dialog */}
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="outline" />}>
            Alert Dialog
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente
                tu cuenta y todos sus datos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction variant="destructive">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Sheet */}
        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>
            Sheet
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Configuración</SheetTitle>
              <SheetDescription>
                Ajusta las preferencias de tu cuenta.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="space-y-1">
                <Label>Nombre de usuario</Label>
                <Input placeholder="@usuario" />
              </div>
              <Separator />
              <div className="space-y-1">
                <Label>Sitio web</Label>
                <Input placeholder="https://tudominio.com" />
              </div>
              <Button className="w-full">Guardar</Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Drawer */}
        <Drawer>
          <DrawerTrigger render={<Button variant="outline" />}>
            Drawer
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Crear nueva tarea</DrawerTitle>
              <DrawerDescription>
                Agrega los detalles de la tarea a continuación.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 space-y-3">
              <div className="space-y-1">
                <Label>Título</Label>
                <Input placeholder="Nombre de la tarea..." />
              </div>
            </div>
            <DrawerFooter>
              <Button>Crear tarea</Button>
              <DrawerClose render={<Button variant="outline" />}>
                Cancelar
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            Dropdown <ChevronDown className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="h-4 w-4" /> Perfil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="h-4 w-4" /> Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tooltip */}
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" />}>
            Tooltip
          </TooltipTrigger>
          <TooltipContent>
            <p>Soy un tooltip descriptivo</p>
          </TooltipContent>
        </Tooltip>

        {/* Popover */}
        <Popover>
          <PopoverTrigger render={<Button variant="outline" />}>
            Popover
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <p className="font-medium text-sm">Filtros</p>
              <Separator />
              <div className="space-y-1">
                <Label>Estado</Label>
                <Input placeholder="Buscar estado..." />
              </div>
              <Button size="sm" className="w-full">
                Aplicar filtros
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Hover Card */}
        <HoverCard>
          <HoverCardTrigger className="text-sm font-medium underline underline-offset-4 cursor-pointer">
            @shadcn (Hover)
          </HoverCardTrigger>
          <HoverCardContent className="w-72">
            <div className="flex gap-3">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>SC</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="font-semibold text-sm">@shadcn</p>
                <p className="text-xs text-muted-foreground">
                  Creador de shadcn/ui. Diseñando componentes accesibles.
                </p>
                <div className="flex items-center gap-1 pt-1">
                  <CalendarDays className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Desde enero 2023</p>
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    </Section>
  );
}
