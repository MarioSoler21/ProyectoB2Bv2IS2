"use client";

import { cn } from "@/lib/utils";

type Props<T extends string> = {
  /** Nombre del grupo para lectores de pantalla. */
  etiqueta: string;
  opciones: Record<T, string>;
  valor: T;
  onCambiar: (valor: T) => void;
};

/** Botones pegados de opción única (Hoy / Mañana / 7 días…). */
export function ControlSegmentado<T extends string>({
  etiqueta,
  opciones,
  valor,
  onCambiar,
}: Props<T>) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="inline-flex h-9 rounded-lg border bg-muted/50 p-0.5">
      {(Object.entries(opciones) as [T, string][]).map(([clave, texto]) => {
        const activo = clave === valor;
        return (
          <button
            key={clave}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => onCambiar(clave)}
            className={cn(
              "rounded-md px-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
              activo && "bg-background text-foreground shadow-sm",
            )}
          >
            {texto}
          </button>
        );
      })}
    </div>
  );
}
