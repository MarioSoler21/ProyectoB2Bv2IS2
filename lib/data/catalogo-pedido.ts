import "server-only";

import type { ProductoPortal } from "@/lib/portal/types";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Catálogo con el que se arman y editan pedidos (portal del cliente y panel
 * de despacho). Filtra explícitamente por tenant_id: usa service_role.
 */

export const SIN_CATEGORIA = "Otros";

/** Columnas de productos que necesita aProductoPedido. */
export const COLUMNAS_PRODUCTO =
  "id, sku, nombre, unidad_medida, precio, stock_actual, categorias_producto ( nombre )";

export type FilaProducto = {
  id: number;
  sku: string;
  nombre: string;
  unidad_medida: string;
  precio: number | string;
  stock_actual: number | string;
  categorias_producto: { nombre: string } | null;
};

export function aProductoPedido(fila: FilaProducto): ProductoPortal {
  return {
    id: fila.id,
    sku: fila.sku,
    nombre: fila.nombre,
    unidad: fila.unidad_medida,
    categoria: fila.categorias_producto?.nombre ?? SIN_CATEGORIA,
    precio: Number(fila.precio),
    stock: Number(fila.stock_actual),
  };
}

export async function getCatalogoPedido(tenantId: number | string): Promise<ProductoPortal[]> {
  const { data, error } = await createAdminClient()
    .from("productos")
    .select(COLUMNAS_PRODUCTO)
    .eq("tenant_id", tenantId)
    .eq("activo", true)
    .order("nombre");

  if (error) throw error;
  return (data as unknown as FilaProducto[]).map(aProductoPedido);
}
