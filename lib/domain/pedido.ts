/**
 * CAPA: Dominio.
 *
 * Reglas de negocio puras del pedido. Este archivo NO puede importar nada de
 * Next, Supabase ni React: solo TypeScript, para poder testearlo sin
 * infraestructura.
 */

export const FLUJO_ESTADOS = [
  "pendiente",
  "confirmado",
  "en_preparacion",
  "despachado",
  "entregado",
] as const;

export type EstadoPedido = (typeof FLUJO_ESTADOS)[number] | "anulado";

export function siguienteEstado(estado: EstadoPedido): EstadoPedido | null {
  const idx = FLUJO_ESTADOS.indexOf(estado as (typeof FLUJO_ESTADOS)[number]);
  if (idx === -1 || idx === FLUJO_ESTADOS.length - 1) return null;
  return FLUJO_ESTADOS[idx + 1];
}

export type OrigenPedido = "vendedor" | "cliente_portal";

/** Un pedido cargado por el vendedor nace confirmado; uno del portal, pendiente. */
export function estadoInicial(origen: OrigenPedido): EstadoPedido {
  return origen === "vendedor" ? "confirmado" : "pendiente";
}

export type ProductoCatalogo = { id: number; precio: number };

export type LineaPedido = {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

/**
 * Arma las líneas del pedido usando SIEMPRE el precio del catálogo (nunca el
 * que pueda venir de un formulario). Ignora cantidades 0, negativas o NaN y
 * productos que no estén en el catálogo recibido.
 */
export function armarLineas(
  catalogo: ProductoCatalogo[],
  cantidades: Map<number, number>,
): LineaPedido[] {
  const lineas: LineaPedido[] = [];
  for (const producto of catalogo) {
    const cantidad = cantidades.get(producto.id);
    if (cantidad === undefined || !Number.isFinite(cantidad) || cantidad <= 0) {
      continue;
    }
    const precioUnitario = Number(producto.precio);
    lineas.push({
      productoId: producto.id,
      cantidad,
      precioUnitario,
      subtotal: cantidad * precioUnitario,
    });
  }
  return lineas;
}

export type TotalesPedido = { subtotal: number; descuento: number; total: number };

export function calcularTotales(lineas: LineaPedido[]): TotalesPedido {
  const subtotal = lineas.reduce((acc, linea) => acc + linea.subtotal, 0);
  const descuento = 0;
  return { subtotal, descuento, total: subtotal - descuento };
}
