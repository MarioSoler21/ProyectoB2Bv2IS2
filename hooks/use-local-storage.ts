"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * Estado JSON persistido en localStorage y sincronizado entre componentes
 * (y entre pestañas, vía el evento "storage").
 *
 * En el servidor y durante la hidratación devuelve null, así el HTML del
 * servidor y el primer render del cliente coinciden. Usa `useHidratado`
 * para saber si el valor ya es el real.
 */

const EVENTO_CAMBIO = "local-storage:cambio";

type Actualizacion<T> = T | null | ((actual: T | null) => T | null);

function suscribir(alCambiar: () => void): () => void {
  window.addEventListener("storage", alCambiar);
  window.addEventListener(EVENTO_CAMBIO, alCambiar);
  return () => {
    window.removeEventListener("storage", alCambiar);
    window.removeEventListener(EVENTO_CAMBIO, alCambiar);
  };
}

function parsear<T>(crudo: string | null): T | null {
  if (crudo === null) return null;
  try {
    return JSON.parse(crudo) as T;
  } catch {
    return null;
  }
}

export function escribirLocalStorage<T>(clave: string, valor: T | null): void {
  if (valor === null) localStorage.removeItem(clave);
  else localStorage.setItem(clave, JSON.stringify(valor));
  window.dispatchEvent(new Event(EVENTO_CAMBIO));
}

export function useLocalStorage<T>(
  clave: string,
): [T | null, (actualizacion: Actualizacion<T>) => void] {
  // Se compara el string crudo (estable entre lecturas) y se parsea aparte.
  const crudo = useSyncExternalStore(
    suscribir,
    () => localStorage.getItem(clave),
    () => null,
  );
  const valor = useMemo(() => parsear<T>(crudo), [crudo]);

  const actualizar = useCallback(
    (actualizacion: Actualizacion<T>) => {
      const siguiente =
        typeof actualizacion === "function"
          ? (actualizacion as (actual: T | null) => T | null)(
              parsear<T>(localStorage.getItem(clave)),
            )
          : actualizacion;
      escribirLocalStorage(clave, siguiente);
    },
    [clave],
  );

  return [valor, actualizar];
}

const sinSuscripcion = () => () => {};

/** false en el servidor y en el render de hidratación; true después. */
export function useHidratado(): boolean {
  return useSyncExternalStore(
    sinSuscripcion,
    () => true,
    () => false,
  );
}
