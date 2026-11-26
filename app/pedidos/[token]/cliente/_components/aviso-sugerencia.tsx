"use client";

import { Lightbulb, X } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Aviso de que el pedido viene precargado a partir del historial del cliente. */
export function AvisoSugerencia({ onCerrar }: { onCerrar: () => void }) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-suggestion/30 bg-suggestion/10 px-4 py-3 text-suggestion"
    >
      <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p className="flex-1 text-sm">
        <span className="font-semibold">Te sugerimos este pedido</span> según tus pedidos
        anteriores. Revísalo y ajusta las cantidades antes de agregarlo.
      </p>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="-mt-1 -mr-2 text-suggestion hover:bg-suggestion/15 hover:text-suggestion"
        aria-label="Cerrar aviso"
        onClick={onCerrar}
      >
        <X />
      </Button>
    </div>
  );
}
