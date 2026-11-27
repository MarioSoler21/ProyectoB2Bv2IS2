import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

/**
 * Lugar reservado para el operador de bodega (entrada por PIN). Todavía no
 * está construido: mientras tanto exige sesión y manda a cada uno a su inicio.
 * Las entradas y ajustes de stock se cargan en Admin → Productos.
 */
export default async function OperadorPage() {
  const sesion = await getSession();
  redirect(sesion ? "/home" : "/login");
}
