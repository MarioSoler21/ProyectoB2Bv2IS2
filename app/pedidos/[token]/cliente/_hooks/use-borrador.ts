"use client";

import { useCallback } from "react";

import { useLocalStorage } from "@/hooks/use-local-storage";
import type { BorradorPedido } from "@/lib/portal/borrador";
import type { FechaISO } from "@/lib/portal/types";

/**
 * Borrador del pedido de un día, autoguardado en el navegador: recargar o
 * cambiar de día no pierde lo que el cliente iba armando.
 */

const prefijoBorrador = (token: string) => `portal:${token}:borrador:`;

/**
 * @param inicial Con qué arranca el borrador si no hay nada guardado.
 *   Debe ser estable entre renders (useMemo en quien llama).
 */
export function useBorrador(token: string, fecha: FechaISO, inicial: BorradorPedido) {
  const [guardado, guardar] = useLocalStorage<BorradorPedido>(
    `${prefijoBorrador(token)}${fecha}`,
  );

  const actualizar = useCallback(
    (cambio: (borrador: BorradorPedido) => BorradorPedido) =>
      guardar((actual) => cambio(actual ?? inicial)),
    [guardar, inicial],
  );

  const descartar = useCallback(() => guardar(null), [guardar]);

  return { borrador: guardado ?? inicial, actualizar, descartar };
}

/** Borra los borradores de días que ya pasaron, para no acumular basura. */
export function limpiarBorradoresVencidos(token: string, hoy: FechaISO): void {
  const prefijo = prefijoBorrador(token);
  const vencidas = Object.keys(localStorage).filter(
    (clave) => clave.startsWith(prefijo) && clave.slice(prefijo.length) < hoy,
  );
  vencidas.forEach((clave) => localStorage.removeItem(clave));
}
