/**
 * CAPA: Adaptador (infraestructura).
 *
 * Implementa PedidoRepository contra Supabase con el cliente admin
 * (service_role, bypassa RLS). Solo usar desde código de servidor.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { ProductoCatalogo } from "@/lib/domain/pedido";
import type {
  NuevoPedido,
  PedidoGuardado,
  PedidoRepository,
} from "@/lib/domain/puertos";

export function repoSupabase(): PedidoRepository {
  const supabase = createAdminClient();

  return {
    async catalogoActivo(tenantId: string): Promise<ProductoCatalogo[]> {
      const { data, error } = await supabase
        .from("productos")
        .select("id, precio")
        .eq("tenant_id", tenantId)
        .eq("activo", true);
      if (error) throw error;
      return (data ?? []).map((p) => ({
        id: Number(p.id),
        precio: Number(p.precio),
      }));
    },

    async guardar(pedido: NuevoPedido): Promise<PedidoGuardado> {
      // numero_pedido lo asigna el trigger de la base (correlativo por tenant).
      const { data, error } = await supabase
        .from("pedidos")
        .insert({
          tenant_id: pedido.tenantId,
          cliente_id: pedido.clienteId,
          origen: pedido.origen,
          estado: pedido.estado,
          subtotal: pedido.subtotal,
          descuento: pedido.descuento,
          total: pedido.total,
        })
        .select("id, numero_pedido")
        .single();
      if (error) throw error;

      const { error: itemsError } = await supabase.from("pedido_items").insert(
        pedido.lineas.map((linea) => ({
          tenant_id: pedido.tenantId,
          pedido_id: data.id,
          producto_id: linea.productoId,
          cantidad: linea.cantidad,
          precio_unitario: linea.precioUnitario,
          subtotal: linea.subtotal,
        })),
      );
      if (itemsError) throw itemsError;

      return { id: Number(data.id), numeroPedido: Number(data.numero_pedido) };
    },
  };
}
