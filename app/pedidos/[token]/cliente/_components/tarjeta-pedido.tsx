"use client";

import { ChevronDown } from "lucide-react";

import { EstadoBadge } from "@/components/estado-badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { agruparPorCategoria } from "@/lib/portal/borrador";
import { formatearCantidad } from "@/lib/portal/formato";
import type { PedidoVista } from "@/lib/portal/types";

import { EncabezadoCategoria } from "@/components/pedido/encabezado-categoria";

/** Pedido ya enviado, en acordeón de solo lectura. */
export function TarjetaPedido({ pedido, ordinal }: { pedido: PedidoVista; ordinal: number }) {
  const grupos = agruparPorCategoria(pedido.lineas, (l) => l.categoria);

  return (
    <Collapsible className="group/pedido overflow-hidden rounded-2xl border bg-card transition-colors data-[state=open]:border-primary/40">
      <CollapsibleTrigger className="w-full px-5 pt-4 pb-4 text-left outline-none focus-visible:bg-accent">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Pedido #{pedido.numero}
          </span>
          <EstadoBadge estado={pedido.estado} />
        </div>

        <div className="mt-2 flex items-end gap-2">
          <span className="text-4xl leading-none font-black">{ordinal}°</span>
          <span className="pb-0.5 text-lg font-bold">pedido del día</span>
          <ChevronDown
            className="ml-auto size-5 text-muted-foreground transition-transform group-data-[state=open]/pedido:rotate-180"
            aria-hidden
          />
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <Dato titulo="Creado" valor={pedido.creadoEtiqueta} />
          <Dato titulo="Entrega" valor={pedido.entregaEtiqueta} />
          <Dato titulo="Productos" valor={String(pedido.lineas.length)} />
        </dl>
      </CollapsibleTrigger>

      <CollapsibleContent className="border-t">
        {grupos.map(({ categoria, items }) => (
          <section key={categoria} aria-label={categoria}>
            <EncabezadoCategoria categoria={categoria} />
            <ul className="divide-y">
              {items.map((linea) => (
                <li key={`${linea.sku}-${linea.nombre}`} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex-1 text-sm">{linea.nombre}</span>
                  <span className="font-semibold tabular-nums">
                    {formatearCantidad(linea.cantidad)}
                  </span>
                  <span className="w-14 text-xs text-muted-foreground uppercase">{linea.unidad}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {pedido.notas && (
          <p className="border-t px-4 py-3 text-sm text-muted-foreground italic">“{pedido.notas}”</p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs tracking-wider text-muted-foreground uppercase">{titulo}</dt>
      <dd className="truncate font-medium">{valor}</dd>
    </div>
  );
}
