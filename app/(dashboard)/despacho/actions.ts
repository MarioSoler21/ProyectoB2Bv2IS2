"use server";

import { revalidatePath } from "next/cache";

import {
  anularPedido,
  despacharPedidos,
  ErrorDespacho,
  guardarEdicion,
  restaurarEstados,
} from "@/lib/data/despacho";
import type { EstadoPrevio, Resultado } from "@/lib/despacho/types";
import {
  edicionPedidoSchema,
  estadosPreviosSchema,
  idPedidoSchema,
  idsPedidosSchema,
} from "@/lib/despacho/validacion";
import { getSession } from "@/lib/session";

const RUTA = "/despacho";

type Autor = { tenantId: string; usuarioId: number };
type Esquema<E> = {
  safeParse: (valor: unknown) => { success: true; data: E } | { success: false };
};

/**
 * Envuelve cada acción: exige sesión, valida la entrada con zod, revalida el
 * tablero y traduce los errores a un mensaje para el usuario.
 */
async function ejecutar<E, T>(
  entrada: unknown,
  esquema: Esquema<E>,
  accion: (autor: Autor, datos: E) => Promise<T>,
): Promise<Resultado<T>> {
  const sesion = await getSession();
  if (!sesion) return { ok: false, error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const validado = esquema.safeParse(entrada);
  if (!validado.success) return { ok: false, error: "Los datos enviados no son válidos." };

  try {
    const datos = await accion({ tenantId: sesion.id, usuarioId: sesion.usuarioId }, validado.data);
    revalidatePath(RUTA);
    return { ok: true, datos };
  } catch (error) {
    if (error instanceof ErrorDespacho) return { ok: false, error: error.message };
    console.error("[despacho] Falló una acción", error);
    return { ok: false, error: "No pudimos guardar el cambio. Intenta de nuevo." };
  }
}

export async function despachar(ids: unknown): Promise<Resultado<EstadoPrevio[]>> {
  return ejecutar(ids, idsPedidosSchema, despacharPedidos);
}

export async function deshacerDespacho(previos: unknown): Promise<Resultado> {
  return ejecutar(previos, estadosPreviosSchema, restaurarEstados);
}

export async function guardarPedido(edicion: unknown): Promise<Resultado> {
  return ejecutar(edicion, edicionPedidoSchema, guardarEdicion);
}

export async function anular(id: unknown): Promise<Resultado> {
  return ejecutar(id, idPedidoSchema, anularPedido);
}
