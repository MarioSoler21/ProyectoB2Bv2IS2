"use client";

import { Route } from "lucide-react";

import { EstadoBadge } from "@/components/estado-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { tonoDelDia } from "@/lib/despacho/agrupacion";
import { ACCION, siguientePaso, type EstadoAvance } from "@/lib/despacho/ciclo";
import { estaDespachado } from "@/lib/despacho/filtros";
import type { PedidoDespacho } from "@/lib/despacho/types";
import { contar } from "@/lib/portal/formato";
import type { FechaISO } from "@/lib/portal/types";
import { cn } from "@/lib/utils";

import { ICONO_ACCION } from "./iconos-accion";
import { Insignia } from "./insignia";

type Props = {
  pedido: PedidoDespacho;
  hoy: FechaISO;
  etiquetaEntrega: string;
  seleccionado: boolean;
  onSeleccionar: (seleccionado: boolean) => void;
  ocupado: boolean;
  onAbrir: () => void;
  onAvanzar: (hacia: EstadoAvance) => void;
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
  ocupado,
  onAbrir,
  onAvanzar,
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
        <EstadoBadge estado={pedido.estado} className="ml-auto" />
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

      <AccionesTarjeta estado={pedido.estado} ocupado={ocupado} onAvanzar={onAvanzar} />
    </article>
  );
}

/**
 * El paso siguiente del pedido, y "Despachar" como atajo mientras todavía no
 * está listo (se puede despachar sin pasar por confirmar o preparar).
 */
function AccionesTarjeta({
  estado,
  ocupado,
  onAvanzar,
}: {
  estado: PedidoDespacho["estado"];
  ocupado: boolean;
  onAvanzar: (hacia: EstadoAvance) => void;
}) {
  const siguiente = siguientePaso(estado);
  if (!siguiente) return null;

  const pasos: EstadoAvance[] =
    siguiente === "confirmado" || siguiente === "en_preparacion" ? [siguiente, "despachado"] : [siguiente];

  return (
    <div className="relative grid auto-cols-fr grid-flow-col gap-2">
      {pasos.map((hacia) => {
        const Icono = ICONO_ACCION[hacia];
        return (
          <Button
            key={hacia}
            size="sm"
            variant={hacia === "despachado" ? "default" : "outline"}
            className="h-9"
            disabled={ocupado}
            onClick={() => onAvanzar(hacia)}
          >
            <Icono /> {ACCION[hacia]}
          </Button>
        );
      })}
    </div>
  );
}
