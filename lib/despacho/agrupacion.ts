import type { FechaISO } from "@/lib/portal/types";

import { estaDespachado } from "./filtros";
import type { PedidoDespacho } from "./types";

/**
 * Tono del día en el tablero:
 * - hoy: ámbar (lo que hay que despachar ya)
 * - vencido: rojo, SOLO si quedan pendientes de un día pasado
 * - proximo / pasado: neutro (un día pasado ya despachado no es una alerta)
 */
export type TonoDia = "hoy" | "vencido" | "proximo" | "pasado";

export type GrupoDia = {
  fecha: FechaISO;
  tono: TonoDia;
  /** Los pedidos visibles con los filtros actuales. */
  pedidos: PedidoDespacho[];
  /** Avance real del día (sin filtros): cuántos salieron de cuántos. */
  despachados: number;
  total: number;
};

/** También sirve para una sola tarjeta: pendientes = 1 si el pedido no salió. */
export function tonoDelDia(fecha: FechaISO, hoy: FechaISO, pendientes: number): TonoDia {
  if (fecha === hoy) return "hoy";
  if (fecha > hoy) return "proximo";
  return pendientes > 0 ? "vencido" : "pasado";
}

/** Orden de los grupos: hoy, luego los próximos días y al final el historial (más reciente primero). */
function compararFechas(hoy: FechaISO) {
  const rango = (fecha: FechaISO) => (fecha === hoy ? 0 : fecha > hoy ? 1 : 2);
  return (a: FechaISO, b: FechaISO) =>
    rango(a) - rango(b) || (a > hoy ? a.localeCompare(b) : b.localeCompare(a));
}

function porFecha(pedidos: PedidoDespacho[]) {
  return Map.groupBy(pedidos, (p) => p.fechaEntrega);
}

/**
 * Agrupa los pedidos visibles por día. El avance ("3/8 despachados") y el
 * tono salen de TODOS los pedidos del día: con el filtro "Pendientes" un día
 * a medio despachar no debe verse como 0/N.
 */
export function agruparPorDia(
  visibles: PedidoDespacho[],
  hoy: FechaISO,
  todos: PedidoDespacho[] = visibles,
): GrupoDia[] {
  const visiblesPorFecha = porFecha(visibles);
  const todosPorFecha = porFecha(todos);

  return [...visiblesPorFecha.keys()].sort(compararFechas(hoy)).map((fecha) => {
    const delDia = todosPorFecha.get(fecha) ?? [];
    const despachados = delDia.filter((p) => estaDespachado(p.estado)).length;
    return {
      fecha,
      tono: tonoDelDia(fecha, hoy, delDia.length - despachados),
      pedidos: visiblesPorFecha.get(fecha)!,
      despachados,
      total: delDia.length,
    };
  });
}
