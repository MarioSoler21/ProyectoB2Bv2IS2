"use server";

/**
 * CAPA: Interfaz (server action del portal de cliente, sin login).
 *
 * Re-resuelve cliente y tenant desde el token en el servidor: del formulario
 * solo se usan las cantidades. Las reglas de negocio viven en lib/domain +
 * lib/aplicacion.
 */

import { redirect } from "next/navigation";

import { getClientePorToken } from "@/lib/data/portal";
import { crearPedido } from "@/lib/aplicacion/crear-pedido";
import { repoSupabase } from "@/lib/infra/repo-supabase";

function leerCantidades(formData: FormData): Map<number, number> {
  const cantidades = new Map<number, number>();
  for (const [clave, valor] of formData.entries()) {
    const match = /^cantidad_(\d+)$/.exec(clave);
    if (match) cantidades.set(Number(match[1]), Number(valor));
  }
  return cantidades;
}

export async function enviarPedidoCliente(formData: FormData) {
  const token = String(formData.get("token") ?? "");

  const cliente = await getClientePorToken(token);
  if (!cliente) {
    throw new Error("Token invalido o cliente inactivo.");
  }

  const pedido = await crearPedido(repoSupabase(), {
    tenantId: String(cliente.tenant_id),
    clienteId: String(cliente.id),
    origen: "cliente_portal",
    cantidades: leerCantidades(formData),
  });

  redirect(
    `/pedidos/${encodeURIComponent(token)}/cliente?pedido=${pedido.numeroPedido}`,
  );
}
