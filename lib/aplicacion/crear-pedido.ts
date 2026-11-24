/**
 * CAPA: Caso de uso (aplicación).
 *
 * Orquesta el dominio y el puerto para crear un pedido. Recibe el
 * repositorio por parámetro (inyección de dependencias): Supabase en
 * producción, un fake en memoria en los tests.
 */

import {
  armarLineas,
  calcularTotales,
  estadoInicial,
  type OrigenPedido,
} from "@/lib/domain/pedido";
import type { PedidoGuardado, PedidoRepository } from "@/lib/domain/puertos";

export type CrearPedidoInput = {
  tenantId: string;
  clienteId: string;
  origen: OrigenPedido;
  cantidades: Map<number, number>;
};

export const ERROR_SIN_LINEAS =
  "Elegí al menos un producto con cantidad mayor a cero.";

export async function crearPedido(
  repo: PedidoRepository,
  { tenantId, clienteId, origen, cantidades }: CrearPedidoInput,
): Promise<PedidoGuardado> {
  const catalogo = await repo.catalogoActivo(tenantId);
  const lineas = armarLineas(catalogo, cantidades);

  if (lineas.length === 0) {
    throw new Error(ERROR_SIN_LINEAS);
  }

  return repo.guardar({
    tenantId,
    clienteId,
    origen,
    estado: estadoInicial(origen),
    lineas,
    ...calcularTotales(lineas),
  });
}
