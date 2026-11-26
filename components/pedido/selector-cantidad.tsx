"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CANTIDAD_MAXIMA } from "@/lib/portal/borrador";

type Props = {
  cantidad: number;
  /** Nombre del producto, para que los lectores de pantalla sepan qué se modifica. */
  producto: string;
  onCambiar: (cantidad: number) => void;
};

/**
 * Stepper − [cantidad] +. El mínimo es 1: para quitar el producto está el
 * botón × de la fila, así un 0 tipeado por error no borra la línea.
 */
export function SelectorCantidad({ cantidad, producto, onCambiar }: Props) {
  // Mientras se edita se muestra lo que el usuario tipea ("", "2.") sin forzarlo a número.
  const [texto, setTexto] = useState<string | null>(null);

  function alTipear(valor: string) {
    setTexto(valor);
    const n = Number(valor);
    if (valor !== "" && Number.isFinite(n) && n > 0) onCambiar(n);
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="size-10 sm:size-9"
        aria-label={`Quitar uno de ${producto}`}
        disabled={cantidad <= 1}
        onClick={() => onCambiar(cantidad - 1)}
      >
        <Minus />
      </Button>
      <Input
        type="number"
        inputMode="decimal"
        min={1}
        max={CANTIDAD_MAXIMA}
        step="any"
        aria-label={`Cantidad de ${producto}`}
        value={texto ?? String(cantidad)}
        onFocus={(e) => {
          setTexto(String(cantidad));
          e.target.select();
        }}
        onChange={(e) => alTipear(e.target.value)}
        onBlur={() => setTexto(null)}
        className="h-10 w-14 px-1 text-center font-semibold tabular-nums [appearance:textfield] sm:h-9 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="size-10 sm:size-9"
        aria-label={`Agregar uno de ${producto}`}
        disabled={cantidad >= CANTIDAD_MAXIMA}
        onClick={() => onCambiar(cantidad + 1)}
      >
        <Plus />
      </Button>
    </div>
  );
}
