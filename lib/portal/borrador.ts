import type { LineaPedido, PedidoNuevo, ProductoPortal } from "./types";

/**
 * Reglas puras del armado de un pedido (sin React ni almacenamiento): qué
 * pasa al sumar, cambiar o quitar líneas y cómo se arranca un borrador.
 */

export const CANTIDAD_MAXIMA = 9999;
export const NOTAS_MAX_CARACTERES = 500;

/** De dónde salieron las líneas con las que arrancó el borrador. */
export type OrigenBorrador = "sugerencia" | "carrito" | "vacio";

export type BorradorPedido = {
  lineas: LineaPedido[];
  notas: string;
  origen: OrigenBorrador;
  /** El cliente cerró el aviso de "pedido sugerido". */
  avisoCerrado: boolean;
};

/** Acota a [0, CANTIDAD_MAXIMA] con hasta 2 decimales (hay productos por libra). */
export function normalizarCantidad(valor: number): number {
  if (!Number.isFinite(valor) || valor <= 0) return 0;
  return Math.min(Math.round(valor * 100) / 100, CANTIDAD_MAXIMA);
}

export function cantidadDe(lineas: LineaPedido[], productoId: number): number {
  return lineas.find((l) => l.productoId === productoId)?.cantidad ?? 0;
}

/** Fija la cantidad de un producto. Con 0 (o menos) la línea se quita. */
export function fijarCantidad(
  lineas: LineaPedido[],
  productoId: number,
  cantidad: number,
): LineaPedido[] {
  const nueva = normalizarCantidad(cantidad);
  if (nueva === 0) return quitarLinea(lineas, productoId);

  const existe = lineas.some((l) => l.productoId === productoId);
  return existe
    ? lineas.map((l) => (l.productoId === productoId ? { ...l, cantidad: nueva } : l))
    : [...lineas, { productoId, cantidad: nueva }];
}

/** Suma una unidad del producto (lo agrega si no estaba). */
export function agregarUno(lineas: LineaPedido[], productoId: number): LineaPedido[] {
  return fijarCantidad(lineas, productoId, cantidadDe(lineas, productoId) + 1);
}

export function quitarLinea(lineas: LineaPedido[], productoId: number): LineaPedido[] {
  return lineas.filter((l) => l.productoId !== productoId);
}

/**
 * Punto de partida del borrador de un día: lo que ya está en el carrito para
 * ese día, si no la sugerencia (plantilla / último pedido), si no vacío.
 */
export function borradorInicial(
  enCarrito: PedidoNuevo | undefined,
  sugerencia: LineaPedido[],
): BorradorPedido {
  if (enCarrito) {
    return {
      lineas: enCarrito.lineas,
      notas: enCarrito.notas,
      origen: "carrito",
      avisoCerrado: true,
    };
  }
  if (sugerencia.length > 0) {
    return { lineas: sugerencia, notas: "", origen: "sugerencia", avisoCerrado: false };
  }
  return { lineas: [], notas: "", origen: "vacio", avisoCerrado: true };
}

export function aPedidoNuevo(
  fechaEntrega: string,
  borrador: BorradorPedido,
): PedidoNuevo {
  return {
    fechaEntrega,
    notas: borrador.notas.trim(),
    lineas: borrador.lineas.filter((l) => l.cantidad > 0),
  };
}

export function totalEstimado(
  lineas: LineaPedido[],
  productosPorId: ReadonlyMap<number, ProductoPortal>,
): number {
  return lineas.reduce(
    (total, l) => total + l.cantidad * (productosPorId.get(l.productoId)?.precio ?? 0),
    0,
  );
}

export type GrupoCategoria<T> = { categoria: string; items: T[] };

/** Agrupa por categoría (orden alfabético) respetando el orden de los items dentro de cada grupo. */
export function agruparPorCategoria<T>(
  items: T[],
  categoriaDe: (item: T) => string,
): GrupoCategoria<T>[] {
  const grupos = new Map<string, T[]>();
  for (const item of items) {
    const categoria = categoriaDe(item);
    grupos.set(categoria, [...(grupos.get(categoria) ?? []), item]);
  }
  return [...grupos.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "es"))
    .map(([categoria, itemsDelGrupo]) => ({ categoria, items: itemsDelGrupo }));
}
