import type { ProductoPortal } from "./types";

/** Resultados visibles antes de "Ver más": evita que la lista empuje todo el pedido. */
export const RESULTADOS_INICIALES = 8;

/** Minúsculas y sin tildes, para comparar textos escritos a mano. */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/**
 * Puntaje de coincidencia: substring (mejor cuanto antes aparezca) o, si no,
 * subsecuencia penalizada por huecos. -1 = no coincide.
 */
export function puntajeCoincidencia(texto: string, consulta: string): number {
  const t = normalizar(texto);
  const q = normalizar(consulta).trim();
  if (!q) return 0;

  const indice = t.indexOf(q);
  if (indice === 0) return 1000;
  if (indice > 0) return 850 - indice;

  let desde = 0;
  let anterior = -1;
  let huecos = 0;
  for (const caracter of q) {
    const encontrado = t.indexOf(caracter, desde);
    if (encontrado === -1) return -1;
    if (anterior !== -1) huecos += encontrado - anterior - 1;
    anterior = encontrado;
    desde = encontrado + 1;
  }
  return 500 - huecos * 6;
}

/** Productos que coinciden con la consulta (por nombre o código), del mejor al peor. */
export function buscarProductos(
  productos: ProductoPortal[],
  consulta: string,
): ProductoPortal[] {
  if (!consulta.trim()) return [];

  return productos
    .map((producto) => ({
      producto,
      puntaje: puntajeCoincidencia(`${producto.nombre} ${producto.sku}`, consulta),
    }))
    .filter(({ puntaje }) => puntaje >= 0)
    .sort(
      (a, b) =>
        b.puntaje - a.puntaje || a.producto.nombre.localeCompare(b.producto.nombre),
    )
    .map(({ producto }) => producto);
}
