"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { FileDown, PackageOpen } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { agruparPorDia } from "@/lib/despacho/agrupacion";
import {
  estaDespachado,
  filtrarPedidos,
  FILTROS_INICIALES,
  hayFiltrosActivos,
  type Filtros,
} from "@/lib/despacho/filtros";
import type { EstadoPrevio, PedidoDespacho, TableroDespacho as Datos } from "@/lib/despacho/types";
import { contar } from "@/lib/portal/formato";

import { despachar, deshacerDespacho } from "../actions";
import { BarraFiltros } from "./barra-filtros";
import { BarraSeleccion } from "./barra-seleccion";
import { DialogoPedido } from "./dialogo-pedido";
import { GrupoDiaEncabezado } from "./grupo-dia";
import { TarjetaDespacho } from "./tarjeta-despacho";

type Props = Datos & { empresa: string };

/** Tiempo para arrepentirse de un despacho antes de que el aviso desaparezca. */
const DURACION_DESHACER_MS = 10_000;

function marcarDespachados(pedidos: PedidoDespacho[], ids: ReadonlySet<number>): PedidoDespacho[] {
  return pedidos.map((p) => (ids.has(p.id) && !estaDespachado(p.estado) ? { ...p, estado: "despachado" } : p));
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
  // Se ven despachados al instante; el servidor confirma (o revierte) después.
  const [vista, marcarOptimista] = useOptimistic(pedidos, marcarDespachados);

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
  const pedidoAbierto = vista.find((p) => p.id === abiertoId) ?? null;

  function alternarSeleccion(id: number, marcado: boolean) {
    setSeleccion((actual) => {
      const nueva = new Set(actual);
      if (marcado) nueva.add(id);
      else nueva.delete(id);
      return nueva;
    });
  }

  function deshacer(previos: EstadoPrevio[]) {
    iniciar(async () => {
      const resultado = await deshacerDespacho(previos);
      if (resultado.ok) toast.success("Despacho deshecho");
      else toast.error(resultado.error);
    });
  }

  function despacharPedidos(ids: number[]) {
    const pendientes = vista.filter((p) => ids.includes(p.id) && !estaDespachado(p.estado));
    if (pendientes.length === 0) return;

    iniciar(async () => {
      marcarOptimista(new Set(pendientes.map((p) => p.id)));
      const resultado = await despachar(pendientes.map((p) => p.id));
      if (!resultado.ok) {
        toast.error(resultado.error);
        return;
      }
      setSeleccion(new Set());
      const previos = resultado.datos;
      const mensaje =
        previos.length === 1
          ? `Pedido #${pendientes[0].numero} despachado`
          : `${contar(previos.length, "pedido")} despachados`;
      toast.success(mensaje, {
        duration: DURACION_DESHACER_MS,
        action: { label: "Deshacer", onClick: () => deshacer(previos) },
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
                        onDespachar={() => despacharPedidos([pedido.id])}
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
          pendientes={seleccionados.filter((p) => !estaDespachado(p.estado)).length}
          ocupado={ocupado}
          onDespachar={() => despacharPedidos(seleccionados.map((p) => p.id))}
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
