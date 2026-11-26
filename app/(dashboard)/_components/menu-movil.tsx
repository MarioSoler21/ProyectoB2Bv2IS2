"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/**
 * En pantallas chicas la barra lateral se abre desde un botón. El contenido
 * (navegación, negocio, cerrar sesión) llega ya renderizado desde el layout.
 */
export function MenuMovil({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null);
  // Se cierra solo al navegar: queda abierto únicamente en la ruta donde se abrió.
  const abierto = abiertoEn === pathname;

  return (
    <Sheet open={abierto} onOpenChange={(valor) => setAbiertoEn(valor ? pathname : null)}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Abrir menú">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-sidebar p-4 text-sidebar-foreground">
        <SheetTitle className="sr-only">Menú</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}
