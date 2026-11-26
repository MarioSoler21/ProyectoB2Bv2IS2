"use client";

import { Check, Route, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { tonoDelDia } from "@/lib/despacho/agrupacion";
import { estaDespachado } from "@/lib/despacho/filtros";
import type { PedidoDespacho } from "@/lib/despacho/types";
import { contar } from "@/lib/portal/formato";
import type { FechaISO } from "@/lib/portal/types";
import { cn } from "@/lib/utils";

import { Insignia } from "./insignia";

type Props = {
  pedido: PedidoDespacho;
  hoy: FechaISO;
  etiquetaEntrega: string;
  seleccionado: boolean;
  onSeleccionar: (seleccionado: boolean) => void;
  onAbrir: () => void;
  onDespachar: () => void;
};

/**
 * Tarjeta de un pedido. Toda la tarjeta abre el detalle (un botón que la
 * cubre); la casilla y "Despachar" quedan por encima, así no hay controles
 * anidados dentro de otro control.
 */
export function TarjetaDespacho({
  pedido,
  hoy,
  etiquetaEntrega,
  seleccionado,
  onSeleccionar,
  onAbrir,
  onDespachar,
}: Props) {
  const despachado = estaDespachado(pedido.estado);
  const tono = tonoDelDia(pedido.fechaEntrega, hoy, despachado ? 0 : 1);
  const productos = contar(pedido.lineas.length, "prod.", "prod.");

  return (
    <article
      className={cn(
        "relative flex flex-col gap-2 rounded-xl border bg-card p-3 transition-[filter,transform] hover:brightness-110 has-[[data-abrir]:active]:scale-[0.98]",
        // Tintes mezclados con el fondo de la tarjeta (no con opacidad): así
        // la tarjeta sigue opaca y la marca de agua no se transparenta.
        despachado && "border-success/30 bg-[color-mix(in_oklab,var(--success)_6%,var(--card))]",
        seleccionado &&
          "border-primary/60 bg-[color-mix(in_oklab,var(--primary)_6%,var(--card))] ring-1 ring-primary/40",
      )}
    >
      <button
        type="button"
        data-abrir
        onClick={onAbrir}
        aria-label={`Ver pedido #${pedido.numero} de ${pedido.cliente.nombre}`}
        className="absolute inset-0 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />

      <div className="flex items-center gap-2">
        <Checkbox
          checked={seleccionado}
          onCheckedChange={(valor) => onSeleccionar(valor === true)}
          aria-label={`Seleccionar pedido #${pedido.numero}`}
          className="relative size-5"
        />
        <Insignia tono={pedido.origen === "cliente_portal" ? "portal" : "manual"}>
          {pedido.origen === "cliente_portal" ? "Portal" : "Manual"}
        </Insignia>
        {despachado && (
          <Insignia tono="despachado" className="ml-auto">
            <Check className="size-3" aria-hidden /> Despachado
          </Insignia>
        )}
      </div>

      <div className="min-w-0">
        <h3 className="line-clamp-2 text-sm leading-snug font-bold text-foreground">
          {pedido.cliente.nombre}
        </h3>
        {pedido.cliente.contacto && (
          <p className="truncate text-xs text-muted-foreground">{pedido.cliente.contacto}</p>
        )}
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <Insignia tono={tono}>Entrega: {etiquetaEntrega}</Insignia>
        {pedido.ruta && (
          <span className="flex min-w-0 items-center gap-1 text-xs text-route">
            <Route className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{pedido.ruta.nombre}</span>
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t pt-2 text-xs">
        <span className="font-semibold text-foreground tabular-nums">
          #{pedido.numero} · {productos}
        </span>
        <span className="text-muted-foreground">{pedido.creadoEtiqueta}</span>
      </div>

      {!despachado && (
        <Button size="sm" className="relative h-9 w-full" onClick={onDespachar}>
          <Truck /> Despachar
        </Button>
      )}
    </article>
  );
}
