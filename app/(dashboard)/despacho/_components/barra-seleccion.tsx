"use client";

import { FileDown, Truck, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  cantidad: number;
  /** Cuántos de los seleccionados siguen pendientes (los únicos que se pueden despachar). */
  pendientes: number;
  ocupado: boolean;
  onDespachar: () => void;
  onPdf: () => void;
  onLimpiar: () => void;
};

/** Acciones en lote sobre los pedidos marcados. Flota abajo, siempre a mano. */
export function BarraSeleccion({ cantidad, pendientes, ocupado, onDespachar, onPdf, onLimpiar }: Props) {
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
      <Button onClick={onDespachar} disabled={ocupado || pendientes === 0}>
        <Truck /> Despachar ({pendientes})
      </Button>
      <Button variant="outline" onClick={onPdf} disabled={ocupado}>
        <FileDown /> PDF ({cantidad})
      </Button>
      <Button variant="ghost" size="icon" onClick={onLimpiar} aria-label="Quitar selección">
        <X />
      </Button>
    </div>
  );
}
