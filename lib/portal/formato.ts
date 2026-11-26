/** Formatos de presentación del portal (moneda y cantidades en es-HN). */

const moneda = new Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL" });
const numero = new Intl.NumberFormat("es-HN", { maximumFractionDigits: 2 });

export function formatearMoneda(valor: number): string {
  return moneda.format(valor);
}

export function formatearCantidad(valor: number): string {
  return numero.format(valor);
}

/** "1 producto", "3 productos". */
export function contar(cantidad: number, singular: string, plural = `${singular}s`): string {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}
