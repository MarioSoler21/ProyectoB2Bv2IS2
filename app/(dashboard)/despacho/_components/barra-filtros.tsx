"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ETIQUETA_ESTADO,
  ETIQUETA_FECHA,
  FILTROS_INICIALES,
  hayFiltrosActivos,
  type Filtros,
} from "@/lib/despacho/filtros";
import type { OpcionFiltro } from "@/lib/despacho/types";

import { ControlSegmentado } from "./control-segmentado";
import { FiltroMultiple } from "./filtro-multiple";

type Props = {
  filtros: Filtros;
  onCambiar: (filtros: Filtros) => void;
  clientes: OpcionFiltro[];
  rutas: OpcionFiltro[];
};

/** Búsqueda + filtros combinables. Las rutas van en un multiselect, no en chips: en móvil ocupaban media pantalla. */
export function BarraFiltros({ filtros, onCambiar, clientes, rutas }: Props) {
  function fijar<K extends keyof Filtros>(clave: K, valor: Filtros[K]) {
    onCambiar({ ...filtros, [clave]: valor });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-72">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={filtros.texto}
          onChange={(e) => fijar("texto", e.target.value)}
          placeholder="#pedido, cliente o producto…"
          aria-label="Buscar por número de pedido, cliente o producto"
          className="h-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
        />
      </div>

      <ControlSegmentado
        etiqueta="Estado"
        opciones={ETIQUETA_ESTADO}
        valor={filtros.estado}
        onCambiar={(estado) => fijar("estado", estado)}
      />
      <ControlSegmentado
        etiqueta="Fecha de entrega"
        opciones={ETIQUETA_FECHA}
        valor={filtros.fecha}
        onCambiar={(fecha) => fijar("fecha", fecha)}
      />
      <FiltroMultiple
        titulo="Clientes"
        opciones={clientes}
        seleccionados={filtros.clientes}
        onCambiar={(ids) => fijar("clientes", ids)}
      />
      <FiltroMultiple
        titulo="Rutas"
        opciones={rutas}
        seleccionados={filtros.rutas}
        onCambiar={(ids) => fijar("rutas", ids)}
      />

      {hayFiltrosActivos(filtros) && (
        <Button variant="ghost" className="h-9" onClick={() => onCambiar(FILTROS_INICIALES)}>
          <X /> Limpiar
        </Button>
      )}
    </div>
  );
}
