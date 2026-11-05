import { ThemeToggle } from "@/components/theme-toggle";
import { Sparkles } from "lucide-react";
import { ButtonsSection } from "@/components/demo/buttons-section";
import { FormsSection } from "@/components/demo/forms-section";
import { OverlaysSection } from "@/components/demo/overlays-section";
import { FeedbackSection } from "@/components/demo/feedback-section";
import { DataSection } from "@/components/demo/data-section";
import { NavigationSection } from "@/components/demo/navigation-section";
import { ItemsSection } from "@/components/demo/items-section";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-3 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold">shadcn/ui template</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-16">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Componentes demo</h1>
          <p className="text-muted-foreground">
            Verificación visual de todos los componentes instalados.
          </p>
        </div>

        <ButtonsSection />
        <FormsSection />
        <FeedbackSection />
        <OverlaysSection />
        <NavigationSection />
        <DataSection />
        <ItemsSection />
      </div>
    </main>
  );
}
