import { z } from "zod";

import { CANTIDAD_MAXIMA, NOTAS_MAX_CARACTERES } from "./borrador";

/**
 * Esquema del envío del carrito. Corre en el servidor: lo que llega del
 * navegador nunca se usa sin pasar por acá (ni el tenant ni el cliente, que
 * salen del token, ni los precios, que salen del catálogo).
 */

const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

const lineaSchema = z.object({
  productoId: z.number().int().positive(),
  cantidad: z.number().positive().max(CANTIDAD_MAXIMA),
});

/** Líneas + notas de un pedido; lo comparten el portal y el panel de despacho. */
export const lineasSchema = z
  .array(lineaSchema)
  .min(1, "Un pedido necesita al menos un producto")
  .max(200)
  .refine(
    (lineas) => new Set(lineas.map((l) => l.productoId)).size === lineas.length,
    "Un producto aparece dos veces en el mismo pedido",
  );

export const notasSchema = z.string().trim().max(NOTAS_MAX_CARACTERES);

const pedidoNuevoSchema = z.object({
  fechaEntrega: fechaISO,
  notas: notasSchema,
  lineas: lineasSchema,
});

export const envioCarritoSchema = z
  .array(pedidoNuevoSchema)
  .min(1, "El carrito está vacío")
  .max(20)
  .refine(
    (pedidos) => new Set(pedidos.map((p) => p.fechaEntrega)).size === pedidos.length,
    "Hay dos pedidos para el mismo día en el carrito",
  );
