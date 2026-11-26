"use client";

import { useCallback, useMemo } from "react";

import { useLocalStorage } from "@/hooks/use-local-storage";
import { esFechaSeleccionable } from "@/lib/portal/fechas";
import type { FechaISO, PedidoNuevo } from "@/lib/portal/types";

/**
 * Carrito del portal: un pedido por día de entrega, guardado en el
 * navegador hasta que el cliente lo envía. Los días que ya pasaron se
 * ignoran (el servidor igual los rechazaría).
 */
export function useCarrito(token: string, hoy: FechaISO) {
  const [guardado, guardar] = useLocalStorage<PedidoNuevo[]>(`portal:${token}:carrito`);

  const pedidos = useMemo(
    () =>
      (guardado ?? [])
        .filter((p) => esFechaSeleccionable(p.fechaEntrega, hoy))
        .sort((a, b) => a.fechaEntrega.localeCompare(b.fechaEntrega)),
    [guardado, hoy],
  );

  /** Agrega o reemplaza el pedido de ese día. */
  const guardarPedido = useCallback(
    (pedido: PedidoNuevo) =>
      guardar((actual) => [
        ...(actual ?? []).filter((p) => p.fechaEntrega !== pedido.fechaEntrega),
        pedido,
      ]),
    [guardar],
  );

  const quitarPedido = useCallback(
    (fecha: FechaISO) =>
      guardar((actual) => {
        const restantes = (actual ?? []).filter((p) => p.fechaEntrega !== fecha);
        return restantes.length > 0 ? restantes : null;
      }),
    [guardar],
  );

  const vaciar = useCallback(() => guardar(null), [guardar]);

  return { pedidos, guardarPedido, quitarPedido, vaciar };
}
