import "server-only";

import { redirect } from "next/navigation";

import { puede, type Permiso } from "@/lib/auth/permisos";
import { getSession, type Session } from "@/lib/session";

/**
 * Guardas de acceso del servidor. Cada página y cada server action las llama
 * por su cuenta: el layout no alcanza, porque una navegación puede renderizar
 * la página sin volver a pasar por él.
 */

/** Para páginas: sin sesión va al login; sin permiso, al inicio. */
export async function exigirPermiso(permiso: Permiso): Promise<Session> {
  const sesion = await getSession();
  if (!sesion) redirect("/login");
  if (!puede(sesion.rol, permiso)) redirect("/home");
  return sesion;
}

/** Error con un mensaje apto para mostrarle al usuario tal cual. */
export class SinPermiso extends Error {}

/** Para server actions: lanza SinPermiso en vez de redirigir. */
export async function sesionConPermiso(permiso: Permiso): Promise<Session> {
  const sesion = await getSession();
  if (!sesion) throw new SinPermiso("Tu sesión expiró. Vuelve a iniciar sesión.");
  if (!puede(sesion.rol, permiso)) {
    throw new SinPermiso("Tu rol no tiene permiso para hacer esto.");
  }
  return sesion;
}
