"use server";

import { redirect } from "next/navigation";

import { sesionConPermiso } from "@/lib/auth/acceso";
import { getClienteDeCartera } from "@/lib/data/catalogo";
import { CANTIDAD_MAXIMA } from "@/lib/portal/borrador";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Crea un pedido "desde dentro de la app" para un cliente de la cartera de
 * quien está en sesión. El cliente tiene que ser del tenant, estar activo y
 * (si es un vendedor) estar asignado a él. Los precios salen del catálogo
 * activo, nunca del formulario.
 *
 * La venta queda a nombre del vendedor: el que la carga si es vendedor, o el
 * vendedor asignado al cliente si la carga un admin.
 */
export async function crearPedido(formData: FormData) {
  const sesion = await sesionConPermiso("tomar_pedidos");

  const cliente = await getClienteDeCartera(sesion, Number(formData.get("clienteId")));
  if (!cliente) throw new Error("Ese cliente no está en tu cartera o ya no está activo.");

  const supabase = createAdminClient();
  const { data: productos, error: productosError } = await supabase
    .from("productos")
    .select("id, precio")
    .eq("tenant_id", sesion.id)
    .eq("activo", true);
  if (productosError) throw productosError;

  const items = productos
    .map((producto) => ({
      producto,
      cantidad: Number(formData.get(`cantidad_${producto.id}`) ?? 0),
    }))
    .filter((item) => Number.isFinite(item.cantidad) && item.cantidad > 0);

  if (items.length === 0) {
    throw new Error("Elige al menos un producto con cantidad mayor a cero.");
  }
  if (items.some((item) => item.cantidad > CANTIDAD_MAXIMA)) {
    throw new Error(`La cantidad máxima por producto es ${CANTIDAD_MAXIMA}.`);
  }

  const subtotal = items.reduce((acc, item) => acc + item.cantidad * Number(item.producto.precio), 0);
  const esVendedor = sesion.rol === "vendedor";

  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .insert({
      tenant_id: sesion.id,
      cliente_id: cliente.id,
      zona_id: cliente.zona_id,
      vendedor_id: esVendedor ? sesion.usuarioId : cliente.vendedor_id,
      origen: esVendedor ? "vendedor" : "admin",
      estado: "confirmado",
      subtotal,
      descuento: 0,
      total: subtotal,
    })
    .select("id, numero_pedido")
    .single();
  if (pedidoError) throw pedidoError;

  const { error: itemsError } = await supabase.from("pedido_items").insert(
    items.map((item) => ({
      tenant_id: sesion.id,
      pedido_id: pedido.id,
      producto_id: item.producto.id,
      cantidad: item.cantidad,
      precio_unitario: item.producto.precio,
      subtotal: item.cantidad * Number(item.producto.precio),
    })),
  );
  if (itemsError) {
    // Sin transacción vía PostgREST: se anula (nunca DELETE) para no dejar un
    // pedido confirmado sin líneas en el tablero de despacho.
    await supabase.from("pedidos").update({ estado: "anulado" }).eq("id", pedido.id).eq("tenant_id", sesion.id);
    throw itemsError;
  }

  await supabase.from("pedido_historial").insert({
    tenant_id: sesion.id,
    pedido_id: pedido.id,
    estado_anterior: null,
    estado_nuevo: "confirmado",
    empleado_id: sesion.usuarioId,
    comentario: esVendedor ? "Tomado por el vendedor" : "Cargado por un administrador",
  });

  redirect(`/mis-clientes?creado=${pedido.numero_pedido}`);
}
