"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { OpcionFiltro } from "@/lib/despacho/types";
import { normalizar } from "@/lib/portal/busqueda";

type Props = {
  /** "Clientes", "Rutas"… */
  titulo: string;
  opciones: OpcionFiltro[];
  seleccionados: number[];
  onCambiar: (ids: number[]) => void;
};

/**
 * Filtro de selección múltiple con búsqueda (el "faceted filter" de shadcn).
 * Con muchas opciones es imprescindible poder escribir para encontrarlas.
 */
export function FiltroMultiple({ titulo, opciones, seleccionados, onCambiar }: Props) {
  const [consulta, setConsulta] = useState("");
  const elegidos = new Set(seleccionados);

  const visibles = useMemo(() => {
    const q = normalizar(consulta.trim());
    return q ? opciones.filter((o) => normalizar(o.nombre).includes(q)) : opciones;
  }, [opciones, consulta]);

  function alternar(id: number, marcado: boolean) {
    onCambiar(marcado ? [...seleccionados, id] : seleccionados.filter((s) => s !== id));
  }

  return (
    <Popover onOpenChange={(abierto) => !abierto && setConsulta("")}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 gap-1.5 rounded-lg">
          {titulo}
          {seleccionados.length > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground tabular-nums">
              {seleccionados.length}
            </span>
          )}
          <ChevronDown className="text-muted-foreground" aria-hidden />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-64 gap-0 p-0">
        <div className="relative border-b p-2">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder={`Buscar ${titulo.toLowerCase()}…`}
            aria-label={`Buscar ${titulo.toLowerCase()}`}
            className="h-9 pl-8"
          />
        </div>

        <ul className="max-h-64 overflow-y-auto p-1" aria-label={titulo}>
          {visibles.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">Sin resultados</li>
          )}
          {visibles.map((opcion) => {
            const idCasilla = `filtro-${titulo}-${opcion.id}`;
            return (
              <li key={opcion.id}>
                <label
                  htmlFor={idCasilla}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-muted"
                >
                  <Checkbox
                    id={idCasilla}
                    checked={elegidos.has(opcion.id)}
                    onCheckedChange={(valor) => alternar(opcion.id, valor === true)}
                  />
                  <span className="truncate">{opcion.nombre}</span>
                </label>
              </li>
            );
          })}
        </ul>

        {seleccionados.length > 0 && (
          <div className="border-t p-1">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => onCambiar([])}>
              Quitar selección
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
