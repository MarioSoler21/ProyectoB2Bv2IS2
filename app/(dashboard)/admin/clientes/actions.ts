"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, parseId, pgErrorState } from "@/lib/admin-action-utils";
import { parseForm, clienteSchema, type FormState } from "@/lib/validation/admin";

/**
 * La FK clientes.vendedor_id no impide asignar un usuario de otra empresa ni
 * uno que no es vendedor (y el admin usa service_role, que se salta RLS).
 */
async function validarVendedor(tenantId: string, vendedorId: number | null): Promise<FormState | null> {
  if (vendedorId === null) return null;
  const { data, error } = await createAdminClient()
    .from("usuarios")
    .select("id")
    .eq("id", vendedorId)
    .eq("tenant_id", tenantId)
    .eq("rol", "vendedor")
    .eq("activo", true)
    .maybeSingle();
  if (error) return pgErrorState(error);
  if (!data) {
    return { ok: false, fieldErrors: { vendedor_id: ["Elige un vendedor activo de tu empresa."] } };
  }
  return null;
}

export async function crearCliente(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const tenant = await requireAdmin();
  const parsed = parseForm(clienteSchema, formData);
  if (!parsed.ok) return parsed.state;
  const vendedorInvalido = await validarVendedor(tenant.id, parsed.data.vendedor_id);
  if (vendedorInvalido) return vendedorInvalido;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("clientes")
    .insert({ ...parsed.data, tenant_id: tenant.id });
  if (error) return pgErrorState(error);

  revalidatePath("/admin/clientes");
  revalidatePath("/mis-clientes");
  return { ok: true };
}

export async function actualizarCliente(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const tenant = await requireAdmin();
  const id = parseId(formData);
  if (!id) return { ok: false, error: "ID inválido." };
  const parsed = parseForm(clienteSchema, formData);
  if (!parsed.ok) return parsed.state;
  const vendedorInvalido = await validarVendedor(tenant.id, parsed.data.vendedor_id);
  if (vendedorInvalido) return vendedorInvalido;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("clientes")
    .update(parsed.data)
    .eq("id", id)
    .eq("tenant_id", tenant.id);
  if (error) return pgErrorState(error);

  revalidatePath("/admin/clientes");
  revalidatePath("/mis-clientes");
  return { ok: true };
}

export async function setActivoCliente(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const tenant = await requireAdmin();
  const id = parseId(formData);
  if (!id) return { ok: false, error: "ID inválido." };
  const activo = formData.get("activo") === "true";

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("clientes")
    .update({ activo })
    .eq("id", id)
    .eq("tenant_id", tenant.id);
  if (error) return pgErrorState(error);

  revalidatePath("/admin/clientes");
  revalidatePath("/mis-clientes");
  return { ok: true };
}

export async function regenerarTokenCliente(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const tenant = await requireAdmin();
  const id = parseId(formData);
  if (!id) return { ok: false, error: "ID inválido." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("clientes")
    .update({ token_unico: crypto.randomUUID() })
    .eq("id", id)
    .eq("tenant_id", tenant.id);
  if (error) return pgErrorState(error);

  revalidatePath("/admin/clientes");
  return { ok: true };
}
