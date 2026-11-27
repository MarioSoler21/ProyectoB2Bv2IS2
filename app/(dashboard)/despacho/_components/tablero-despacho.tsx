"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { FileDown, PackageOpen } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { agruparPorDia } from "@/lib/despacho/agrupacion";
import {
  ESTADOS_AVANCE,
  MINUTOS_PARA_DESHACER,
  puedeAvanzar,
  RESULTADO,
  type EstadoAvance,
} from "@/lib/despacho/ciclo";
import {
  filtrarPedidos,
  FILTROS_INICIALES,
  hayFiltrosActivos,
  type Filtros,
} from "@/lib/despacho/filtros";
import type { PedidoDespacho, TableroDespacho as Datos } from "@/lib/despacho/types";
import { contar } from "@/lib/portal/formato";

import { avanzarEstado, deshacerEstado } from "../actions";
import { BarraFiltros } from "./barra-filtros";
import { BarraSeleccion } from "./barra-seleccion";
import { DialogoPedido } from "./dialogo-pedido";
import { GrupoDiaEncabezado } from "./grupo-dia";
import { TarjetaDespacho } from "./tarjeta-despacho";

type Props = Datos & { empresa: string };

/**
 * Cuánto queda a la vista el aviso con "Deshacer". El servidor acepta deshacer
 * hasta MINUTOS_PARA_DESHACER después; pasado eso, lo rechaza.
 */
const DURACION_DESHACER_MS = 10_000;

type Cambio = { ids: ReadonlySet<number>; hacia: EstadoAvance };

function aplicarCambio(pedidos: PedidoDespacho[], { ids, hacia }: Cambio): PedidoDespacho[] {
  return pedidos.map((p) => (ids.has(p.id) && puedeAvanzar(p.estado, hacia) ? { ...p, estado: hacia } : p));
}

/**
 * Tablero de despacho: pedidos agrupados por día de entrega, filtros
 * combinables, selección para acciones en lote y edición en un modal.
 */
export function TableroDespacho({
  empresa,
  hoy,
  pedidos,
  etiquetasDia,
  clientes,
  rutas,
  catalogo,
  productosRetirados,
}: Props) {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES);
  const [seleccion, setSeleccion] = useState<ReadonlySet<number>>(new Set());
  const [abiertoId, setAbiertoId] = useState<number | null>(null);
  const [ocupado, iniciar] = useTransition();
  // El cambio de estado se ve al instante; el servidor confirma (o revierte) después.
  const [vista, aplicarOptimista] = useOptimistic(pedidos, aplicarCambio);

  const productosPorId = useMemo(
    () => new Map([...catalogo, ...productosRetirados].map((p) => [p.id, p])),
    [catalogo, productosRetirados],
  );
  const filtrados = useMemo(
    () => filtrarPedidos(vista, filtros, hoy, productosPorId),
    [vista, filtros, hoy, productosPorId],
  );
  const grupos = useMemo(() => agruparPorDia(filtrados, hoy, vista), [filtrados, hoy, vista]);

  const seleccionados = vista.filter((p) => seleccion.has(p.id));
  const elegiblesSeleccion = Object.fromEntries(
    ESTADOS_AVANCE.map((hacia) => [hacia, seleccionados.filter((p) => puedeAvanzar(p.estado, hacia)).length]),
  ) as Record<EstadoAvance, number>;
  const pedidoAbierto = vista.find((p) => p.id === abiertoId) ?? null;

  function alternarSeleccion(id: number, marcado: boolean) {
    setSeleccion((actual) => {
      const nueva = new Set(actual);
      if (marcado) nueva.add(id);
      else nueva.delete(id);
      return nueva;
    });
  }

  function deshacer(ids: number[], estado: EstadoAvance) {
    iniciar(async () => {
      const resultado = await deshacerEstado({ ids, estado });
      if (resultado.ok) toast.success("Cambio deshecho");
      else toast.error(resultado.error);
    });
  }

  function avanzar(ids: readonly number[], hacia: EstadoAvance) {
    const elegibles = vista.filter((p) => ids.includes(p.id) && puedeAvanzar(p.estado, hacia));
    if (elegibles.length === 0) return;

    iniciar(async () => {
      aplicarOptimista({ ids: new Set(elegibles.map((p) => p.id)), hacia });
      const resultado = await avanzarEstado({ ids: elegibles.map((p) => p.id), hacia });
      if (!resultado.ok) {
        toast.error(resultado.error);
        return;
      }
      setSeleccion(new Set());
      const cambiados = resultado.datos;
      if (cambiados.length === 0) {
        toast.info("Esos pedidos ya habían cambiado de estado.");
        return;
      }
      const { uno, varios } = RESULTADO[hacia];
      const primero = elegibles.find((p) => p.id === cambiados[0]);
      const mensaje =
        cambiados.length === 1 && primero
          ? `Pedido #${primero.numero} ${uno}`
          : `${contar(cambiados.length, "pedido")} ${varios}`;
      toast.success(mensaje, {
        description: `Puedes deshacerlo durante ${MINUTOS_PARA_DESHACER} minutos.`,
        duration: DURACION_DESHACER_MS,
        action: { label: "Deshacer", onClick: () => deshacer(cambiados, hacia) },
      });
    });
  }

  async function descargarPdf(lista: PedidoDespacho[]) {
    if (lista.length === 0) return;
    try {
      const { descargarListaDespacho } = await import("@/lib/despacho/pdf");
      await descargarListaDespacho({ pedidos: lista, productosPorId, etiquetasDia, empresa });
    } catch (error) {
      console.error("[despacho] No se pudo generar el PDF", error);
      toast.error("No pudimos generar el PDF.");
    }
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-xl font-semibold">Despacho</h1>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums" aria-live="polite">
              <span className="size-2 animate-pulse rounded-full bg-success" aria-hidden />
              {contar(filtrados.length, "pedido")}
              {filtrados.length !== vista.length && <span> de {vista.length}</span>}
            </span>
          </div>
          <Button variant="outline" onClick={() => descargarPdf(filtrados)} disabled={filtrados.length === 0}>
            <FileDown /> PDF de lo filtrado
          </Button>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-3 lg:px-6">
          <BarraFiltros filtros={filtros} onCambiar={setFiltros} clientes={clientes} rutas={rutas} />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 lg:px-6">
        {grupos.length === 0 ? (
          <EstadoVacio
            hayPedidos={vista.length > 0}
            conFiltros={hayFiltrosActivos(filtros)}
            onLimpiar={() => setFiltros(FILTROS_INICIALES)}
          />
        ) : (
          <div className="space-y-8">
            {grupos.map((grupo) => {
              const etiqueta = etiquetasDia[grupo.fecha] ?? grupo.fecha;
              return (
                <section key={grupo.fecha} aria-label={etiqueta}>
                  <GrupoDiaEncabezado grupo={grupo} etiqueta={etiqueta} />
                  <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {grupo.pedidos.map((pedido) => (
                      <TarjetaDespacho
                        key={pedido.id}
                        pedido={pedido}
                        hoy={hoy}
                        etiquetaEntrega={etiqueta}
                        seleccionado={seleccion.has(pedido.id)}
                        onSeleccionar={(marcado) => alternarSeleccion(pedido.id, marcado)}
                        onAbrir={() => setAbiertoId(pedido.id)}
                        ocupado={ocupado}
                        onAvanzar={(hacia) => avanzar([pedido.id], hacia)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <BarraSeleccion
          cantidad={seleccionados.length}
          elegibles={elegiblesSeleccion}
          ocupado={ocupado}
          onAvanzar={(hacia) => avanzar([...seleccion], hacia)}
          onPdf={() => descargarPdf(seleccionados)}
          onLimpiar={() => setSeleccion(new Set())}
        />
      </main>

      <DialogoPedido
        pedido={pedidoAbierto}
        catalogo={catalogo}
        productosPorId={productosPorId}
        onCerrar={() => setAbiertoId(null)}
      />
    </>
  );
}

function EstadoVacio({
  hayPedidos,
  conFiltros,
  onLimpiar,
}: {
  hayPedidos: boolean;
  conFiltros: boolean;
  onLimpiar: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card/60 px-6 py-14 text-center">
      <PackageOpen className="size-10 text-muted-foreground" aria-hidden />
      <div className="space-y-1">
        <p className="font-semibold">
          {hayPedidos ? "Ningún pedido coincide con los filtros" : "No hay pedidos para despachar"}
        </p>
        <p className="text-sm text-muted-foreground">
          {hayPedidos
            ? "Prueba con otra fecha, ruta o estado."
            : "Cuando entren pedidos nuevos van a aparecer acá, agrupados por día de entrega."}
        </p>
      </div>
      {conFiltros && (
        <Button variant="outline" onClick={onLimpiar}>
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
