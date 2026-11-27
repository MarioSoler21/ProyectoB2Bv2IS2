"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, parseId, pgErrorState } from "@/lib/admin-action-utils";
import {
  movimientoStockSchema,
  parseForm,
  productoSchema,
  type FormState,
} from "@/lib/validation/admin";

function revalidate() {
  revalidatePath("/admin/productos");
  revalidatePath("/mis-clientes");
  revalidatePath("/despacho");
}

export async function crearProducto(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const tenant = await requireAdmin();
  const parsed = parseForm(productoSchema, formData);
  if (!parsed.ok) return parsed.state;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("productos")
    .insert({ ...parsed.data, tenant_id: tenant.id });
  if (error) return pgErrorState(error);

  revalidate();
  return { ok: true };
}

export async function actualizarProducto(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const tenant = await requireAdmin();
  const id = parseId(formData);
  if (!id) return { ok: false, error: "ID inválido." };
  const parsed = parseForm(productoSchema, formData);
  if (!parsed.ok) return parsed.state;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("productos")
    .update(parsed.data)
    .eq("id", id)
    .eq("tenant_id", tenant.id);
  if (error) return pgErrorState(error);

  revalidate();
  return { ok: true };
}

export async function setActivoProducto(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const tenant = await requireAdmin();
  const id = parseId(formData);
  if (!id) return { ok: false, error: "ID inválido." };
  const activo = formData.get("activo") === "true";

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("productos")
    .update({ activo })
    .eq("id", id)
    .eq("tenant_id", tenant.id);
  if (error) return pgErrorState(error);

  revalidate();
  return { ok: true };
}

/**
 * Entrada de mercadería o ajuste por conteo. La función de la base bloquea el
 * producto, guarda el movimiento y actualiza el stock en una transacción.
 */
export async function registrarMovimientoStock(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const tenant = await requireAdmin();
  const parsed = parseForm(movimientoStockSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { producto_id, tipo, cantidad, motivo } = parsed.data;
  if (tipo === "entrada" && cantidad <= 0) {
    return { ok: false, fieldErrors: { cantidad: ["Una entrada tiene que ser mayor a cero."] } };
  }

  const { error } = await createAdminClient().rpc("registrar_movimiento_stock", {
    p_tenant_id: Number(tenant.id),
    p_producto_id: producto_id,
    p_tipo: tipo,
    p_cantidad: cantidad,
    p_motivo: motivo ?? (tipo === "entrada" ? "Entrada de mercadería" : "Ajuste por conteo"),
    p_usuario_id: tenant.usuarioId,
  });
  if (error) return pgErrorState(error);

  revalidatePath("/admin/productos");
  revalidatePath("/dashboard");
  return { ok: true };
}
