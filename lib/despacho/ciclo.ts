import type { EstadoPedido } from "@/lib/data/pedidos";

/**
 * Ciclo de vida del pedido en el tablero:
 *
 *   pendiente → confirmado → en preparación → despachado → entregado
 *
 * Se puede saltar hacia adelante (despachar un pendiente es válido), nunca
 * hacia atrás: para volver está "Deshacer", que el servidor resuelve con el
 * historial. Tiene que coincidir con cambiar_estado_pedidos (migración
 * 20261127100003), que es quien de verdad aplica la regla.
 */

export const ESTADOS_AVANCE = ["confirmado", "en_preparacion", "despachado", "entregado"] as const;

export type EstadoAvance = (typeof ESTADOS_AVANCE)[number];

const DESDE: Record<EstadoAvance, readonly EstadoPedido[]> = {
  confirmado: ["pendiente"],
  en_preparacion: ["pendiente", "confirmado"],
  despachado: ["pendiente", "confirmado", "en_preparacion"],
  entregado: ["despachado"],
};

const SIGUIENTE: Partial<Record<EstadoPedido, EstadoAvance>> = {
  pendiente: "confirmado",
  confirmado: "en_preparacion",
  en_preparacion: "despachado",
  despachado: "entregado",
};

/** Botón que lleva a cada estado. */
export const ACCION: Record<EstadoAvance, string> = {
  confirmado: "Confirmar",
  en_preparacion: "Preparar",
  despachado: "Despachar",
  entregado: "Entregado",
};

/** "Pedido #12 …" / "3 pedidos …" */
export const RESULTADO: Record<EstadoAvance, { uno: string; varios: string }> = {
  confirmado: { uno: "confirmado", varios: "confirmados" },
  en_preparacion: { uno: "en preparación", varios: "en preparación" },
  despachado: { uno: "despachado", varios: "despachados" },
  entregado: { uno: "entregado", varios: "entregados" },
};

/** Minutos que hay para deshacer un cambio de estado (lo hace cumplir el servidor). */
export const MINUTOS_PARA_DESHACER = 15;

export function puedeAvanzar(estado: EstadoPedido, hacia: EstadoAvance): boolean {
  return DESDE[hacia].includes(estado);
}

/** El paso que sigue para un pedido, o null si ya terminó (entregado o anulado). */
export function siguientePaso(estado: EstadoPedido): EstadoAvance | null {
  return SIGUIENTE[estado] ?? null;
}
