import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { EstadoPedido } from "@/lib/data/pedidos";

/**
 * A diferencia de getTableroDespacho (lib/data/despacho.ts), esto trae los
 * pedidos del tenant en cualquier estado — para dashboard y exportación
 * (PDF/CSV). Pagina de a 1000 filas (el tope de PostgREST) para que los
 * números no dejen de cuadrar en silencio cuando haya muchos pedidos.
 */

export type PedidoReporte = {
  id: number;
  numero_pedido: number;
  estado: EstadoPedido;
  fecha_pedido: string;
  subtotal: number;
  descuento: number;
  total: number;
  cliente: { id: number; nombre_negocio: string } | null;
  items: {
    cantidad: number;
    subtotal: number;
    producto: { nombre: string } | null;
  }[];
};

const TAMANO_PAGINA = 1000;

/** `desde`: instante ISO; solo pedidos tomados a partir de ahí. Sin él, todo el histórico. */
export async function getPedidosReporte(
  tenantId: string,
  { desde }: { desde?: string } = {},
): Promise<PedidoReporte[]> {
  const supabase = createAdminClient();
  const pedidos: PedidoReporte[] = [];

  for (let pagina = 0; ; pagina++) {
    let consulta = supabase
      .from("pedidos")
      .select(
        `id, numero_pedido, estado, fecha_pedido, subtotal, descuento, total,
         cliente:clientes ( id, nombre_negocio ),
         items:pedido_items ( cantidad, subtotal, producto:productos ( nombre ) )`,
      )
      .eq("tenant_id", tenantId);
    if (desde) consulta = consulta.gte("fecha_pedido", desde);

    const { data, error } = await consulta
      .order("fecha_pedido", { ascending: false })
      .order("id", { ascending: false })
      .range(pagina * TAMANO_PAGINA, (pagina + 1) * TAMANO_PAGINA - 1);
    if (error) throw error;

    const filas = (data ?? []) as unknown as PedidoReporte[];
    pedidos.push(
      ...filas.map((p) => ({
        ...p,
        subtotal: Number(p.subtotal),
        descuento: Number(p.descuento),
        total: Number(p.total),
        items: p.items.map((i) => ({ ...i, cantidad: Number(i.cantidad), subtotal: Number(i.subtotal) })),
      })),
    );
    if (filas.length < TAMANO_PAGINA) return pedidos;
  }
}

/** Clientes activos del tenant (para "compraron X de Y"). */
export async function contarClientesActivos(tenantId: string): Promise<number> {
  const { count, error } = await createAdminClient()
    .from("clientes")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("activo", true);
  if (error) throw error;
  return count ?? 0;
}
