/**
 * CAPA: Adaptador (infraestructura, fake para tests).
 *
 * Implementa PedidoRepository en memoria: sin red ni base de datos.
 * Expone `guardados` para que los tests inspeccionen lo persistido.
 */

import type { ProductoCatalogo } from "@/lib/domain/pedido";
import type {
  NuevoPedido,
  PedidoGuardado,
  PedidoRepository,
} from "@/lib/domain/puertos";

export type ProductoEnMemoria = ProductoCatalogo & {
  tenantId: string;
  activo?: boolean;
};

export type PedidoEnMemoria = NuevoPedido & PedidoGuardado;

export type RepoMemoria = PedidoRepository & {
  guardados: PedidoEnMemoria[];
};

export function repoMemoria(productos: ProductoEnMemoria[] = []): RepoMemoria {
  const guardados: PedidoEnMemoria[] = [];
  const correlativos = new Map<string, number>();
  let siguienteId = 1;

  return {
    guardados,

    async catalogoActivo(tenantId) {
      return productos
        .filter((p) => p.tenantId === tenantId && p.activo !== false)
        .map(({ id, precio }) => ({ id, precio }));
    },

    async guardar(pedido) {
      // Simula el trigger de la base: correlativo independiente por tenant.
      const numeroPedido = (correlativos.get(pedido.tenantId) ?? 0) + 1;
      correlativos.set(pedido.tenantId, numeroPedido);
      const guardado: PedidoEnMemoria = { ...pedido, id: siguienteId++, numeroPedido };
      guardados.push(guardado);
      return { id: guardado.id, numeroPedido };
    },
  };
}
