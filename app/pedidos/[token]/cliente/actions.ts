"use server";

import { revalidatePath } from "next/cache";

import { enviarPedidos } from "@/lib/data/portal";
import type { ResultadoEnvio } from "@/lib/portal/types";

/**
 * Envía el carrito del portal (sin login). Es un endpoint público: el token
 * identifica al cliente y `pedidos` se valida completo en el servicio.
 */
export async function enviarCarrito(token: unknown, pedidos: unknown): Promise<ResultadoEnvio> {
  if (typeof token !== "string" || token === "") {
    return { ok: false, error: "El enlace no es válido." };
  }

  try {
    const resultado = await enviarPedidos(token, pedidos);
    if (resultado.ok) revalidatePath(`/pedidos/${encodeURIComponent(token)}/cliente`);
    return resultado;
  } catch (error) {
    console.error("[portal] No se pudo registrar el carrito", error);
    return { ok: false, error: "No pudimos enviar tu pedido. Intenta de nuevo en un momento." };
  }
}
