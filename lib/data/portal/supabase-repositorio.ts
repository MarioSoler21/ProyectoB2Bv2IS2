import "server-only";

import { toBranding } from "@/lib/branding";
import {
  getCatalogoPedido,
  SIN_CATEGORIA,
  type FilaProducto,
} from "@/lib/data/catalogo-pedido";
import type { EstadoPedido } from "@/lib/data/pedidos";
import { totalEstimado } from "@/lib/portal/borrador";
import type {
  ClientePortal,
  LineaPedido,
  PedidoEnviado,
} from "@/lib/portal/types";
import { createAdminClient } from "@/lib/supabase/admin";

import type { PortalRepositorio } from "./repositorio";

/**
 * Implementación real sobre Supabase. Usa service_role (bypassa RLS) porque
 * el portal no tiene usuario autenticado — ver README-arquitectura.md §2 —
 * así que TODA consulta filtra explícitamente por tenant_id y cliente_id
 * resueltos desde el token.
 */

const COLUMNAS_BRANDING =
  "nombre_empresa, nombre_app, subtitulo_app, mensaje_portal, logo_url, color_primario, color_secundario, color_sidebar";

type FilaPedido = {
  id: number;
  numero_pedido: number;
  fecha_entrega: string;
  estado: EstadoPedido;
  created_at: string;
  notas: string | null;
  pedido_items: {
    cantidad: number | string;
    productos: Omit<FilaProducto, "id" | "precio" | "stock_actual"> | null;
  }[];
};

type FilaItem = { producto_id: number; cantidad: number | string };

function aPedido(fila: FilaPedido): PedidoEnviado {
  return {
    id: fila.id,
    numero: fila.numero_pedido,
    fechaEntrega: fila.fecha_entrega,
    estado: fila.estado,
    creadoAt: fila.created_at,
    notas: fila.notas,
    lineas: fila.pedido_items.map((item) => ({
      sku: item.productos?.sku ?? "",
      nombre: item.productos?.nombre ?? "Producto eliminado",
      unidad: item.productos?.unidad_medida ?? "",
      categoria: item.productos?.categorias_producto?.nombre ?? SIN_CATEGORIA,
      cantidad: Number(item.cantidad),
    })),
  };
}

function aLinea(fila: FilaItem): LineaPedido {
  return { productoId: fila.producto_id, cantidad: Number(fila.cantidad) };
}

export const supabasePortalRepositorio: PortalRepositorio = {
  async clientePorToken(token) {
    const { data, error } = await createAdminClient()
      .from("clientes")
      .select(`id, nombre_negocio, tenant_id, activo, tenants ( ${COLUMNAS_BRANDING} )`)
      .eq("token_unico", token)
      .maybeSingle();

    if (error) throw error;
    if (!data?.activo) return null;

    const tenant = data.tenants as unknown as Record<string, string | null> | null;
    return {
      id: data.id,
      nombreNegocio: data.nombre_negocio,
      tenantId: data.tenant_id,
      tenantNombre: tenant?.nombre_empresa ?? "",
      branding: toBranding(tenant),
    } satisfies ClientePortal;
  },

  catalogo(cliente) {
    return getCatalogoPedido(cliente.tenantId);
  },

  async pedidosEntre(cliente, desde, hasta) {
    const { data, error } = await createAdminClient()
      .from("pedidos")
      .select(
        `id, numero_pedido, fecha_entrega, estado, created_at, notas,
         pedido_items ( cantidad, productos ( sku, nombre, unidad_medida, categorias_producto ( nombre ) ) )`,
      )
      .eq("tenant_id", cliente.tenantId)
      .eq("cliente_id", cliente.id)
      .neq("estado", "anulado")
      .gte("fecha_entrega", desde)
      .lte("fecha_entrega", hasta)
      .order("created_at");

    if (error) throw error;
    return (data as unknown as FilaPedido[]).map(aPedido);
  },

  async plantillasPorDiaSemana(cliente) {
    const { data, error } = await createAdminClient()
      .from("plantillas_pedido")
      .select("producto_id, dia_semana, cantidad_sugerida")
      .eq("tenant_id", cliente.tenantId)
      .eq("cliente_id", cliente.id);

    if (error) throw error;

    const porDia = new Map<number, LineaPedido[]>();
    for (const fila of data) {
      const linea = aLinea({ producto_id: fila.producto_id, cantidad: fila.cantidad_sugerida });
      porDia.set(fila.dia_semana, [...(porDia.get(fila.dia_semana) ?? []), linea]);
    }
    return porDia;
  },

  async lineasUltimoPedido(cliente) {
    const { data, error } = await createAdminClient()
      .from("pedidos")
      .select("pedido_items ( producto_id, cantidad )")
      .eq("tenant_id", cliente.tenantId)
      .eq("cliente_id", cliente.id)
      .neq("estado", "anulado")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return ((data?.pedido_items ?? []) as FilaItem[]).map(aLinea);
  },

  async crearPedidos(cliente, pedidos, catalogoPorId) {
    const supabase = createAdminClient();
    const numeros: number[] = [];

    for (const pedido of pedidos) {
      const subtotal = totalEstimado(pedido.lineas, catalogoPorId);

      const { data: creado, error: errorPedido } = await supabase
        .from("pedidos")
        .insert({
          tenant_id: cliente.tenantId,
          cliente_id: cliente.id,
          origen: "cliente_portal",
          estado: "pendiente",
          fecha_entrega: pedido.fechaEntrega,
          notas: pedido.notas || null,
          subtotal,
          descuento: 0,
          total: subtotal,
        })
        .select("id, numero_pedido")
        .single();
      if (errorPedido) throw errorPedido;

      const { error: errorItems } = await supabase.from("pedido_items").insert(
        pedido.lineas.map((linea) => {
          const precio = catalogoPorId.get(linea.productoId)?.precio ?? 0;
          return {
            tenant_id: cliente.tenantId,
            pedido_id: creado.id,
            producto_id: linea.productoId,
            cantidad: linea.cantidad,
            precio_unitario: precio,
            subtotal: linea.cantidad * precio,
          };
        }),
      );
      if (errorItems) {
        // Sin transacción vía PostgREST: compensamos anulando (nunca DELETE)
        // para no dejar un pedido vacío pendiente en despacho.
        await supabase.from("pedidos").update({ estado: "anulado" }).eq("id", creado.id);
        throw errorItems;
      }

      numeros.push(creado.numero_pedido);
    }

    return numeros;
  },
};
