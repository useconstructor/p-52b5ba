"use client";

import { useEffect, useState } from "react";
import { Section } from "./section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Terminal,
} from "lucide-react";

export function FeedbackSection() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + 2));
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <Section title="Feedback">
      <div className="space-y-6">
        {/* Alerts */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-medium">Alertas</p>
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Atención</AlertTitle>
            <AlertDescription>
              El comando se ejecutó correctamente en el entorno de staging.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              No se pudo conectar con el servidor. Verifica tu conexión.
            </AlertDescription>
          </Alert>
          <Alert className="border-blue-500/50 text-blue-700 dark:border-blue-500 dark:text-blue-400 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400">
            <Info className="h-4 w-4" />
            <AlertTitle>Info</AlertTitle>
            <AlertDescription>
              Hay una nueva versión disponible. Actualiza para obtener las últimas mejoras.
            </AlertDescription>
          </Alert>
          <Alert className="border-green-500/50 text-green-700 dark:border-green-500 dark:text-green-400 [&>svg]:text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Éxito</AlertTitle>
            <AlertDescription>
              Los cambios fueron guardados correctamente.
            </AlertDescription>
          </Alert>
        </div>

        <Separator />

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-medium">Progress</p>
            <span className="text-sm tabular-nums text-muted-foreground">
              {progress}%
            </span>
          </div>
          <Progress value={progress} />
          <Progress value={65} className="h-2" />
          <Progress value={30} className="h-1" />
        </div>

        <Separator />

        {/* Skeleton */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Skeleton loading</p>
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </div>

        <Separator />

        {/* Toast / Sonner */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Toasts (Sonner)</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast("Mensaje simple")}
            >
              Default
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.success("Guardado correctamente", {
                  description: "Los cambios están disponibles.",
                })
              }
            >
              Success
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.error("Algo salió mal", {
                  description: "Intenta nuevamente más tarde.",
                })
              }
            >
              Error
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.warning("Advertencia", {
                  description: "Esta acción no se puede deshacer.",
                })
              }
            >
              Warning
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.promise(
                  new Promise((resolve) => setTimeout(resolve, 2000)),
                  {
                    loading: "Procesando...",
                    success: "Completado",
                    error: "Falló",
                  }
                )
              }
            >
              Promise
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
