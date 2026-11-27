"use client";

import { FileDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ACCION, ESTADOS_AVANCE, type EstadoAvance } from "@/lib/despacho/ciclo";

import { ICONO_ACCION } from "./iconos-accion";

type Props = {
  cantidad: number;
  /** Cuántos de los seleccionados pueden pasar a cada estado. */
  elegibles: Record<EstadoAvance, number>;
  ocupado: boolean;
  onAvanzar: (hacia: EstadoAvance) => void;
  onPdf: () => void;
  onLimpiar: () => void;
};

/**
 * Acciones en lote sobre los pedidos marcados. Flota abajo, siempre a mano;
 * solo muestra los pasos que aplican a algo de la selección.
 */
export function BarraSeleccion({ cantidad, elegibles, ocupado, onAvanzar, onPdf, onLimpiar }: Props) {
  if (cantidad === 0) return null;

  return (
    <div
      role="region"
      aria-label="Acciones sobre la selección"
      className="sticky bottom-4 z-20 mx-auto mt-6 flex w-fit max-w-full flex-wrap items-center gap-2 rounded-2xl border bg-popover/95 p-2 pl-4 shadow-2xl backdrop-blur"
    >
      <span className="text-sm font-semibold tabular-nums" aria-live="polite">
        {cantidad} {cantidad === 1 ? "seleccionado" : "seleccionados"}
      </span>
      {ESTADOS_AVANCE.filter((hacia) => elegibles[hacia] > 0).map((hacia) => {
        const Icono = ICONO_ACCION[hacia];
        return (
          <Button
            key={hacia}
            variant={hacia === "despachado" ? "default" : "outline"}
            onClick={() => onAvanzar(hacia)}
            disabled={ocupado}
          >
            <Icono /> {ACCION[hacia]} ({elegibles[hacia]})
          </Button>
        );
      })}
      <Button variant="outline" onClick={onPdf} disabled={ocupado}>
        <FileDown /> PDF ({cantidad})
      </Button>
      <Button variant="ghost" size="icon" onClick={onLimpiar} aria-label="Quitar selección">
        <X />
      </Button>
    </div>
  );
}
