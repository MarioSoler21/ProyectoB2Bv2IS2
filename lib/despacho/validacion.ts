import { z } from "zod";

import { FLUJO_ESTADOS } from "@/lib/data/pedidos";
import { lineasSchema, notasSchema } from "@/lib/portal/validacion";

/**
 * Esquemas de las acciones del panel de despacho. Todo lo que llega del
 * navegador pasa por acá; el tenant sale de la sesión y los precios del
 * catálogo, nunca del cliente.
 */

const idPedido = z.number().int().positive();

/** Tope por acción en lote: un día grande cabe de sobra. */
const MAX_LOTE = 500;

export const idsPedidosSchema = z.array(idPedido).min(1).max(MAX_LOTE);

export const estadosPreviosSchema = z
  .array(z.object({ id: idPedido, estado: z.enum(FLUJO_ESTADOS) }))
  .min(1)
  .max(MAX_LOTE);

export const edicionPedidoSchema = z.object({
  id: idPedido,
  lineas: lineasSchema,
  notas: notasSchema,
});

export const idPedidoSchema = idPedido;

export type EdicionPedido = z.infer<typeof edicionPedidoSchema>;
