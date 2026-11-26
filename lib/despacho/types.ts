import type { EstadoPedido } from "@/lib/data/pedidos";
import type { FechaISO, LineaPedido, ProductoPortal } from "@/lib/portal/types";

/** Quién cargó el pedido (columna pedidos.origen). */
export type OrigenPedido = "vendedor" | "cliente_portal" | "admin";

export type OpcionFiltro = { id: number; nombre: string };

export type PedidoDespacho = {
  id: number;
  numero: number;
  estado: EstadoPedido;
  origen: OrigenPedido;
  /** Fecha de entrega, o la del pedido si no tiene una. */
  fechaEntrega: FechaISO;
  /** "Hoy · 01:51 p. m." — formateado en el servidor. */
  creadoEtiqueta: string;
  cliente: { id: number; nombre: string; contacto: string | null };
  ruta: OpcionFiltro | null;
  lineas: LineaPedido[];
  notas: string | null;
  total: number;
};

export type TableroDespacho = {
  hoy: FechaISO;
  pedidos: PedidoDespacho[];
  /** "Hoy", "Mañana", "Jueves 26 nov"… por cada fecha presente, del servidor. */
  etiquetasDia: Record<FechaISO, string>;
  clientes: OpcionFiltro[];
  rutas: OpcionFiltro[];
  /** Productos activos: los que se pueden agregar a un pedido. */
  catalogo: ProductoPortal[];
  /** Productos que ya no están activos pero siguen en algún pedido. */
  productosRetirados: ProductoPortal[];
};

/** Estado de un pedido antes de despacharlo, para poder deshacer. */
export type EstadoPrevio = { id: number; estado: EstadoPedido };

export type Resultado<T = void> = { ok: true; datos: T } | { ok: false; error: string };
