"use client";

import type { DiaEntrega } from "@/lib/portal/fechas";
import type { FechaISO } from "@/lib/portal/types";
import { cn } from "@/lib/utils";

type Props = {
  dias: DiaEntrega[];
  seleccionado: FechaISO;
  conPedido: ReadonlySet<FechaISO>;
  enCarrito: ReadonlySet<FechaISO>;
  onSeleccionar: (fecha: FechaISO) => void;
};

/** "¿Para cuándo es el pedido?": chips de día con indicadores y leyenda. */
export function SelectorDia({ dias, seleccionado, conPedido, enCarrito, onSeleccionar }: Props) {
  return (
    <section aria-labelledby="titulo-dia" className="space-y-2">
      <h2 id="titulo-dia" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        ¿Para cuándo es el pedido?
      </h2>

      <div
        role="radiogroup"
        aria-labelledby="titulo-dia"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pt-1.5 pb-2"
      >
        {dias.map((dia) => {
          const activo = dia.fecha === seleccionado;
          const estados = [
            conPedido.has(dia.fecha) && "con pedido enviado",
            enCarrito.has(dia.fecha) && "en el carrito",
          ].filter(Boolean);

          return (
            <button
              key={dia.fecha}
              type="button"
              role="radio"
              aria-checked={activo}
              aria-label={[dia.etiqueta, dia.fechaCorta, ...estados].join(", ")}
              onClick={() => onSeleccionar(dia.fecha)}
              className={cn(
                "relative flex min-w-17 shrink-0 flex-col items-center rounded-xl border-2 px-3 py-2 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                activo
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground",
              )}
            >
              <span className="text-sm font-bold">{dia.etiqueta}</span>
              <span className="text-xs opacity-80">{dia.fechaCorta}</span>
              <span className="absolute -top-1.5 -right-1.5 flex gap-0.5" aria-hidden>
                {conPedido.has(dia.fecha) && <Punto className="bg-success" />}
                {enCarrito.has(dia.fecha) && <Punto className="bg-primary" />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground" aria-hidden>
        <span className="flex items-center gap-1.5">
          <Punto className="bg-success" /> Pedido enviado
        </span>
        <span className="flex items-center gap-1.5">
          <Punto className="bg-primary" /> En el carrito
        </span>
      </div>
    </section>
  );
}

function Punto({ className }: { className: string }) {
  return <span className={cn("inline-block size-3 rounded-full border-2 border-background", className)} />;
}
