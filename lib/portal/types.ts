import type { TenantBranding } from "@/lib/branding";
import type { EstadoPedido } from "@/lib/data/pedidos";

/**
 * Tipos de dominio del portal de cliente (/pedidos/[token]/cliente).
 * Son independientes de la fuente de datos (Supabase o demo): los
 * repositorios de lib/data/portal/ mapean sus filas a estas formas.
 */

/** Fecha de calendario sin hora, formato YYYY-MM-DD. */
export type FechaISO = string;

export type ProductoPortal = {
  id: number;
  sku: string;
  nombre: string;
  unidad: string;
  categoria: string;
  precio: number;
  stock: number;
};

/** Lo único que el cliente decide de una línea: qué producto y cuánto. */
export type LineaPedido = {
  productoId: number;
  cantidad: number;
};

/** Línea de un pedido ya enviado: guarda los datos del producto tal como se pidió. */
export type LineaPedidoEnviado = {
  sku: string;
  nombre: string;
  unidad: string;
  categoria: string;
  cantidad: number;
};

export type PedidoEnviado = {
  id: number;
  numero: number;
  fechaEntrega: FechaISO;
  estado: EstadoPedido;
  creadoAt: string;
  notas: string | null;
  lineas: LineaPedidoEnviado[];
};

/** Pedido enviado con las fechas ya formateadas en el servidor (zona horaria del negocio). */
export type PedidoVista = PedidoEnviado & {
  creadoEtiqueta: string;
  entregaEtiqueta: string;
};

export type ClientePortal = {
  id: number;
  nombreNegocio: string;
  tenantId: number;
  tenantNombre: string;
  branding: TenantBranding;
};

/** Pedido listo para enviar, tal como lo arma el cliente para un día. */
export type PedidoNuevo = {
  fechaEntrega: FechaISO;
  notas: string;
  lineas: LineaPedido[];
};

export type ResultadoEnvio =
  | { ok: true; numeros: number[] }
  | { ok: false; error: string };
