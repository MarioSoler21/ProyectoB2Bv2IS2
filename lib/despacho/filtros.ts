import type { EstadoPedido } from "@/lib/data/pedidos";
import { sumarDias } from "@/lib/portal/fechas";
import { normalizar } from "@/lib/portal/busqueda";
import type { FechaISO, ProductoPortal } from "@/lib/portal/types";

import type { PedidoDespacho } from "./types";

/** Id del filtro "Sin ruta" (los ids reales de zonas empiezan en 1). */
export const SIN_RUTA = 0;

export type FiltroFecha = "todas" | "hoy" | "manana" | "semana";
export type FiltroEstado = "pendientes" | "despachados" | "todos";

export type Filtros = {
  texto: string;
  fecha: FiltroFecha;
  estado: FiltroEstado;
  clientes: number[];
  rutas: number[];
};

export const FILTROS_INICIALES: Filtros = {
  texto: "",
  fecha: "todas",
  estado: "pendientes",
  clientes: [],
  rutas: [],
};

export const ETIQUETA_FECHA: Record<FiltroFecha, string> = {
  todas: "Todas",
  hoy: "Hoy",
  manana: "Mañana",
  semana: "7 días",
};

export const ETIQUETA_ESTADO: Record<FiltroEstado, string> = {
  pendientes: "Pendientes",
  despachados: "Despachados",
  todos: "Todos",
};

export function estaDespachado(estado: EstadoPedido): boolean {
  return estado === "despachado" || estado === "entregado";
}

/** Si hay algún filtro distinto al inicial (para mostrar "Limpiar"). */
export function hayFiltrosActivos(filtros: Filtros): boolean {
  return (
    filtros.texto.trim() !== "" ||
    filtros.fecha !== FILTROS_INICIALES.fecha ||
    filtros.estado !== FILTROS_INICIALES.estado ||
    filtros.clientes.length > 0 ||
    filtros.rutas.length > 0
  );
}

function enRangoDeFecha(fecha: FechaISO, filtro: FiltroFecha, hoy: FechaISO): boolean {
  switch (filtro) {
    case "todas":
      return true;
    case "hoy":
      return fecha === hoy;
    case "manana":
      return fecha === sumarDias(hoy, 1);
    case "semana":
      return fecha >= hoy && fecha <= sumarDias(hoy, 6);
  }
}

function cumpleEstado(estado: EstadoPedido, filtro: FiltroEstado): boolean {
  if (filtro === "todos") return true;
  return estaDespachado(estado) === (filtro === "despachados");
}

/**
 * Búsqueda libre: número de pedido ("2101" o "#2101"), cliente, contacto o
 * un producto del pedido (nombre o código).
 */
function coincideTexto(
  pedido: PedidoDespacho,
  consulta: string,
  productosPorId: ReadonlyMap<number, ProductoPortal>,
): boolean {
  const q = normalizar(consulta.trim().replace(/^#/, ""));
  if (!q) return true;
  if (String(pedido.numero).startsWith(q)) return true;

  const textos = [
    pedido.cliente.nombre,
    pedido.cliente.contacto ?? "",
    ...pedido.lineas.flatMap((linea) => {
      const producto = productosPorId.get(linea.productoId);
      return producto ? [producto.nombre, producto.sku] : [];
    }),
  ];
  return textos.some((texto) => normalizar(texto).includes(q));
}

export function filtrarPedidos(
  pedidos: PedidoDespacho[],
  filtros: Filtros,
  hoy: FechaISO,
  productosPorId: ReadonlyMap<number, ProductoPortal>,
): PedidoDespacho[] {
  const clientes = new Set(filtros.clientes);
  const rutas = new Set(filtros.rutas);

  return pedidos.filter(
    (pedido) =>
      enRangoDeFecha(pedido.fechaEntrega, filtros.fecha, hoy) &&
      cumpleEstado(pedido.estado, filtros.estado) &&
      (clientes.size === 0 || clientes.has(pedido.cliente.id)) &&
      (rutas.size === 0 || rutas.has(pedido.ruta?.id ?? SIN_RUTA)) &&
      coincideTexto(pedido, filtros.texto, productosPorId),
  );
}
