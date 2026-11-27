import { z } from "zod";

import { lineasSchema, notasSchema } from "@/lib/portal/validacion";

import { ESTADOS_AVANCE } from "./ciclo";

/**
 * Esquemas de las acciones del panel de despacho. Todo lo que llega del
 * navegador pasa por acá; el tenant sale de la sesión, los precios del
 * catálogo y el estado al que vuelve un "deshacer", del historial.
 */

const idPedido = z.number().int().positive();

/** Tope por acción en lote: un día grande cabe de sobra. */
const MAX_LOTE = 500;

const idsPedidos = z.array(idPedido).min(1).max(MAX_LOTE);

/** Avanzar pedidos a un estado (confirmar, preparar, despachar, entregar). */
export const cambioEstadoSchema = z.object({
  ids: idsPedidos,
  hacia: z.enum(ESTADOS_AVANCE),
});

/** Deshacer el último cambio a `estado` de esos pedidos. */
export const deshacerSchema = z.object({
  ids: idsPedidos,
  estado: z.enum(ESTADOS_AVANCE),
});

export const edicionPedidoSchema = z.object({
  id: idPedido,
  lineas: lineasSchema,
  notas: notasSchema,
});

export const idPedidoSchema = idPedido;

export type CambioEstado = z.infer<typeof cambioEstadoSchema>;
export type Deshacer = z.infer<typeof deshacerSchema>;
export type EdicionPedido = z.infer<typeof edicionPedidoSchema>;
