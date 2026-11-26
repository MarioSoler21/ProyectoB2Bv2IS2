import type {
  ClientePortal,
  FechaISO,
  LineaPedido,
  PedidoEnviado,
  PedidoNuevo,
  ProductoPortal,
} from "@/lib/portal/types";

/**
 * Acceso a datos del portal de cliente. El servicio (./index.ts) solo
 * conoce esta interfaz, así la fuente (Supabase o la demo en memoria) se
 * puede cambiar sin tocar reglas de negocio ni UI.
 *
 * Todas las operaciones reciben el cliente ya resuelto desde el token: el
 * tenant y el cliente NUNCA vienen del navegador.
 */
export interface PortalRepositorio {
  clientePorToken(token: string): Promise<ClientePortal | null>;

  /** Productos activos del tenant. */
  catalogo(cliente: ClientePortal): Promise<ProductoPortal[]>;

  /** Pedidos no anulados del cliente con entrega en [desde, hasta], del más viejo al más nuevo. */
  pedidosEntre(
    cliente: ClientePortal,
    desde: FechaISO,
    hasta: FechaISO,
  ): Promise<PedidoEnviado[]>;

  /** Plantilla de pedido recurrente por día de la semana (0 = domingo). */
  plantillasPorDiaSemana(cliente: ClientePortal): Promise<Map<number, LineaPedido[]>>;

  /** Líneas del último pedido no anulado del cliente ([] si nunca pidió). */
  lineasUltimoPedido(cliente: ClientePortal): Promise<LineaPedido[]>;

  /**
   * Crea los pedidos con precios del catálogo. Devuelve los números de
   * pedido asignados, en el mismo orden.
   */
  crearPedidos(
    cliente: ClientePortal,
    pedidos: PedidoNuevo[],
    catalogoPorId: ReadonlyMap<number, ProductoPortal>,
  ): Promise<number[]>;
}
