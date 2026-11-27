"use server";

import { revalidatePath } from "next/cache";

import { sesionConPermiso, SinPermiso } from "@/lib/auth/acceso";
import {
  anularPedido,
  cambiarEstado,
  deshacerCambio,
  ErrorDespacho,
  guardarEdicion,
} from "@/lib/data/despacho";
import type { Resultado } from "@/lib/despacho/types";
import {
  cambioEstadoSchema,
  deshacerSchema,
  edicionPedidoSchema,
  idPedidoSchema,
} from "@/lib/despacho/validacion";

const RUTA = "/despacho";

type Autor = { tenantId: string; usuarioId: number };
type Esquema<E> = {
  safeParse: (valor: unknown) => { success: true; data: E } | { success: false };
};

/**
 * Envuelve cada acción: exige una sesión con permiso de despachar, valida la
 * entrada con zod, revalida el tablero y traduce los errores a un mensaje para
 * el usuario.
 */
async function ejecutar<E, T>(
  entrada: unknown,
  esquema: Esquema<E>,
  accion: (autor: Autor, datos: E) => Promise<T>,
): Promise<Resultado<T>> {
  try {
    const sesion = await sesionConPermiso("despachar");

    const validado = esquema.safeParse(entrada);
    if (!validado.success) return { ok: false, error: "Los datos enviados no son válidos." };

    const datos = await accion({ tenantId: sesion.id, usuarioId: sesion.usuarioId }, validado.data);
    revalidatePath(RUTA);
    return { ok: true, datos };
  } catch (error) {
    if (error instanceof ErrorDespacho || error instanceof SinPermiso) {
      return { ok: false, error: error.message };
    }
    console.error("[despacho] Falló una acción", error);
    return { ok: false, error: "No pudimos guardar el cambio. Intenta de nuevo." };
  }
}

/** Confirmar, preparar, despachar o entregar. Devuelve los ids que cambiaron. */
export async function avanzarEstado(cambio: unknown): Promise<Resultado<number[]>> {
  return ejecutar(cambio, cambioEstadoSchema, cambiarEstado);
}

export async function deshacerEstado(cambio: unknown): Promise<Resultado<number>> {
  return ejecutar(cambio, deshacerSchema, deshacerCambio);
}

export async function guardarPedido(edicion: unknown): Promise<Resultado> {
  return ejecutar(edicion, edicionPedidoSchema, guardarEdicion);
}

export async function anular(id: unknown): Promise<Resultado> {
  return ejecutar(id, idPedidoSchema, anularPedido);
}
