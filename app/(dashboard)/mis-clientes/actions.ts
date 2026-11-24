"use server";

/**
 * CAPA: Interfaz (server action).
 *
 * Solo traduce el FormData a la entrada del caso de uso y redirige. Las
 * reglas (precios del catálogo, estado inicial, validaciones) viven en
 * lib/domain + lib/aplicacion.
 */

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { crearPedido as crearPedidoCasoDeUso } from "@/lib/aplicacion/crear-pedido";
import { repoSupabase } from "@/lib/infra/repo-supabase";

function leerCantidades(formData: FormData): Map<number, number> {
  const cantidades = new Map<number, number>();
  for (const [clave, valor] of formData.entries()) {
    const match = /^cantidad_(\d+)$/.exec(clave);
    if (match) cantidades.set(Number(match[1]), Number(valor));
  }
  return cantidades;
}

export async function crearPedido(formData: FormData) {
  const tenant = await getSession();
  if (!tenant) throw new Error("No hay tenant activo");

  await crearPedidoCasoDeUso(repoSupabase(), {
    tenantId: tenant.id,
    clienteId: String(formData.get("clienteId") ?? ""),
    origen: "vendedor",
    cantidades: leerCantidades(formData),
  });

  redirect("/despacho");
}
