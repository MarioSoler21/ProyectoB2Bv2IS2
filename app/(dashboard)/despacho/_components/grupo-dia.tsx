import type { GrupoDia } from "@/lib/despacho/agrupacion";
import { contar } from "@/lib/portal/formato";

import { Insignia } from "./insignia";

/**
 * Separador de un día: píldora con el tono del día + conteo de despachados +
 * una línea que llena el resto.
 */
export function GrupoDiaEncabezado({ grupo, etiqueta }: { grupo: GrupoDia; etiqueta: string }) {
  const visibles = grupo.pedidos.length;

  return (
    <div className="mb-3 flex items-center gap-3">
      <h2>
        <Insignia tono={grupo.tono} className="px-3 py-1 text-xs">
          {etiqueta}
        </Insignia>
      </h2>
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {contar(visibles, "pedido")} · {grupo.despachados}/{grupo.total} despachados
      </span>
      <div className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}
