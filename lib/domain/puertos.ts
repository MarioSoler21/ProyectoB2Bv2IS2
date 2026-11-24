/**
 * CAPA: Puerto.
 *
 * Contratos que el caso de uso necesita del mundo exterior. Los adaptadores
 * de lib/infra/ los implementan (Supabase, memoria, ...).
 * Sin imports de Next/Supabase/React.
 */

import type {
  EstadoPedido,
  LineaPedido,
  OrigenPedido,
  ProductoCatalogo,
} from "./pedido";

export type NuevoPedido = {
  tenantId: string;
  clienteId: string;
  origen: OrigenPedido;
  estado: EstadoPedido;
  lineas: LineaPedido[];
  subtotal: number;
  descuento: number;
  total: number;
};

export type PedidoGuardado = { id: number; numeroPedido: number };

export interface PedidoRepository {
  /** Productos ACTIVOS del tenant, con su precio vigente. */
  catalogoActivo(tenantId: string): Promise<ProductoCatalogo[]>;
  /** Persiste pedido + líneas y devuelve id y número correlativo. */
  guardar(pedido: NuevoPedido): Promise<PedidoGuardado>;
}
