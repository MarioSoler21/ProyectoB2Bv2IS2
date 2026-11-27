import { sesionConPermiso } from "@/lib/auth/acceso";
import type { FormState } from "@/lib/validation/admin";

/** Módulo de helpers para las server actions de /admin (no es "use server"). */

/**
 * Sesión de un usuario con permiso de administrar. Lanza si no hay sesión o
 * si el rol no alcanza: la UI no ofrece estas acciones a otros roles, así que
 * llegar acá sin permiso es un pedido armado a mano.
 */
export async function requireAdmin() {
  return sesionConPermiso("administrar");
}

export function parseId(formData: FormData): number | null {
  const id = Number(formData.get("id"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function pgErrorState(err: unknown): FormState {
  const e = err as { code?: string; message?: string };
  if (e?.code === "23505") {
    return {
      ok: false,
      error: "Ya existe un registro con ese valor único (ej. SKU repetido).",
    };
  }
  if (e?.code === "23503") {
    return {
      ok: false,
      error: "No se puede eliminar porque otros datos lo usan.",
    };
  }
  return { ok: false, error: e?.message ?? "Ocurrió un error inesperado." };
}
