import "server-only";

import { puede } from "@/lib/auth/permisos";
import type { Session } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Lecturas server-only, explicitamente filtradas por tenant_id (viene de
 * lib/session.ts). Usa el cliente admin (service_role, bypassa RLS) en vez
 * de confiar solo en RLS + JWT — TODO: migrar a un cliente normal una vez
 * las paginas dejen de necesitar el filtro explicito.
 */

export type Cliente = {
  id: number;
  nombre_negocio: string;
  nombre_contacto: string | null;
  telefono: string | null;
  zona_id: number | null;
  vendedor_id: number | null;
};

const COLUMNAS_CLIENTE = "id, nombre_negocio, nombre_contacto, telefono, zona_id, vendedor_id";

/**
 * Cartera de quien está en sesión: todos los clientes activos para quien
 * puede verlos todos (admin); para un vendedor, solo los que tiene asignados.
 */
export async function getCartera(sesion: Session): Promise<Cliente[]> {
  let consulta = createAdminClient()
    .from("clientes")
    .select(COLUMNAS_CLIENTE)
    .eq("tenant_id", sesion.id)
    .eq("activo", true);
  if (!puede(sesion.rol, "ver_todos_los_clientes")) {
    consulta = consulta.eq("vendedor_id", sesion.usuarioId);
  }

  const { data, error } = await consulta.order("nombre_negocio");
  if (error) throw error;
  return data;
}

/** Un cliente de la cartera de la sesión (activo y del tenant), o null. */
export async function getClienteDeCartera(sesion: Session, clienteId: number): Promise<Cliente | null> {
  if (!Number.isInteger(clienteId) || clienteId <= 0) return null;

  let consulta = createAdminClient()
    .from("clientes")
    .select(COLUMNAS_CLIENTE)
    .eq("tenant_id", sesion.id)
    .eq("activo", true)
    .eq("id", clienteId);
  if (!puede(sesion.rol, "ver_todos_los_clientes")) {
    consulta = consulta.eq("vendedor_id", sesion.usuarioId);
  }

  const { data, error } = await consulta.maybeSingle();
  if (error) throw error;
  return data;
}

export type Producto = {
  id: number;
  sku: string;
  nombre: string;
  precio: number;
  stock_actual: number;
};

export async function getProductos(tenantId: string): Promise<Producto[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("productos")
    .select("id, sku, nombre, precio, stock_actual")
    .eq("tenant_id", tenantId)
    .eq("activo", true)
    .order("nombre");

  if (error) throw error;
  return data;
}
