"use client";

import { Section } from "./section";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Calendar, CreditCard, Settings, Smile, User } from "lucide-react";

export function NavigationSection() {
  return (
    <Section title="Navegación">
      <div className="space-y-8">
        {/* Breadcrumb */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Breadcrumb</p>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Inicio</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbEllipsis />
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Proyectos</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Mi proyecto</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <Separator />

        {/* Tabs */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Tabs</p>
          <Tabs defaultValue="cuenta">
            <TabsList>
              <TabsTrigger value="cuenta">Cuenta</TabsTrigger>
              <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
              <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
            </TabsList>
            <TabsContent value="cuenta">
              <Card>
                <CardContent className="pt-4 text-sm text-muted-foreground">
                  Administra la información de tu cuenta y las preferencias de correo.
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="seguridad">
              <Card>
                <CardContent className="pt-4 text-sm text-muted-foreground">
                  Cambia tu contraseña y activa la autenticación de dos factores.
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="notificaciones">
              <Card>
                <CardContent className="pt-4 text-sm text-muted-foreground">
                  Configura qué notificaciones deseas recibir y cómo.
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <Separator />

        {/* Accordion */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Accordion (FAQ)</p>
          <Accordion multiple={false} className="w-full max-w-xl">
            <AccordionItem value="q1">
              <AccordionTrigger>¿Es gratuito usar shadcn/ui?</AccordionTrigger>
              <AccordionContent>
                Sí, completamente. Puedes copiarlo y usarlo en tus proyectos. El código
                es tuyo para modificar según necesites.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>¿Funciona con otros frameworks?</AccordionTrigger>
              <AccordionContent>
                Los componentes están optimizados para React y Next.js, aunque algunos
                pueden adaptarse a otros entornos con ajustes mínimos.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger>¿Puedo personalizar los estilos?</AccordionTrigger>
              <AccordionContent>
                Absolutamente. Edita las variables CSS en globals.css o las clases
                de Tailwind directamente en cada componente.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <Separator />

        {/* Command */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Command palette</p>
          <Command className="rounded-lg border shadow-md max-w-md">
            <CommandInput placeholder="Escribe un comando o busca..." />
            <CommandList>
              <CommandEmpty>Sin resultados.</CommandEmpty>
              <CommandGroup heading="Sugerencias">
                <CommandItem>
                  <Calendar className="h-4 w-4" />
                  <span>Calendario</span>
                </CommandItem>
                <CommandItem>
                  <Smile className="h-4 w-4" />
                  <span>Emojis</span>
                </CommandItem>
                <CommandItem>
                  <Calculator className="h-4 w-4" />
                  <span>Calculadora</span>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Configuración">
                <CommandItem>
                  <User className="h-4 w-4" />
                  <span>Perfil</span>
                </CommandItem>
                <CommandItem>
                  <CreditCard className="h-4 w-4" />
                  <span>Facturación</span>
                </CommandItem>
                <CommandItem>
                  <Settings className="h-4 w-4" />
                  <span>Ajustes</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>

        <Separator />

        {/* Pagination */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Paginación</p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </Section>
  );
}
