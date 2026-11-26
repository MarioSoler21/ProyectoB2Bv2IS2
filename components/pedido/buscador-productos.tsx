"use client";

import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buscarProductos, RESULTADOS_INICIALES } from "@/lib/portal/busqueda";
import { cantidadDe } from "@/lib/portal/borrador";
import { formatearCantidad, formatearMoneda } from "@/lib/portal/formato";
import type { LineaPedido, ProductoPortal } from "@/lib/portal/types";
import { cn } from "@/lib/utils";

type Props = {
  productos: ProductoPortal[];
  lineas: LineaPedido[];
  onAgregar: (productoId: number) => void;
  /** Ejemplo de búsqueda; cada pantalla usa uno que tenga sentido para su usuario. */
  placeholder?: string;
};

/**
 * Buscador por nombre o código. Muestra pocos resultados de entrada (con
 * "Ver más") para no empujar el pedido fuera de la pantalla, y marca los
 * productos que ya están en el pedido con su cantidad.
 */
export function BuscadorProductos({
  productos,
  lineas,
  onAgregar,
  placeholder = "Buscar por nombre o código…",
}: Props) {
  const [consulta, setConsulta] = useState("");
  const [verTodos, setVerTodos] = useState(false);

  const resultados = useMemo(() => buscarProductos(productos, consulta), [productos, consulta]);
  const visibles = verTodos ? resultados : resultados.slice(0, RESULTADOS_INICIALES);
  const ocultos = resultados.length - visibles.length;
  const hayConsulta = consulta.trim() !== "";

  function cambiarConsulta(valor: string) {
    setConsulta(valor);
    setVerTodos(false);
  }

  return (
    <section aria-labelledby="titulo-buscador" className="space-y-2">
      <h2 id="titulo-buscador" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        Agregar productos
      </h2>

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          enterKeyHint="search"
          aria-label="Buscar productos por nombre o código"
          placeholder={placeholder}
          value={consulta}
          onChange={(e) => cambiarConsulta(e.target.value)}
          className="h-11 rounded-xl pr-10 pl-9 [&::-webkit-search-cancel-button]:hidden"
        />
        {hayConsulta && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-2 -translate-y-1/2"
            aria-label="Limpiar búsqueda"
            onClick={() => cambiarConsulta("")}
          >
            <X />
          </Button>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {hayConsulta ? `${resultados.length} resultados` : ""}
      </p>

      {hayConsulta && (
        <div className="overflow-hidden rounded-xl border bg-card">
          {resultados.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No hay productos que coincidan con «{consulta.trim()}».
            </p>
          ) : (
            <ul className="divide-y">
              {visibles.map((producto) => (
                <ResultadoProducto
                  key={producto.id}
                  producto={producto}
                  enPedido={cantidadDe(lineas, producto.id)}
                  onAgregar={() => onAgregar(producto.id)}
                />
              ))}
            </ul>
          )}
          {ocultos > 0 && (
            <Button
              type="button"
              variant="ghost"
              className="h-11 w-full rounded-none border-t"
              onClick={() => setVerTodos(true)}
            >
              Ver {ocultos} más
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

function ResultadoProducto({
  producto,
  enPedido,
  onAgregar,
}: {
  producto: ProductoPortal;
  enPedido: number;
  onAgregar: () => void;
}) {
  const sinStock = producto.stock <= 0;
  const yaAgregado = enPedido > 0;

  return (
    <li>
      <button
        type="button"
        disabled={sinStock}
        onClick={onAgregar}
        aria-label={`Agregar ${producto.nombre}${yaAgregado ? `, ya tienes ${formatearCantidad(enPedido)}` : ""}`}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors outline-none hover:bg-accent focus-visible:bg-accent disabled:cursor-not-allowed disabled:opacity-50",
          yaAgregado && "bg-success/5",
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{producto.nombre}</p>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono">{producto.sku}</span>
            {" · "}
            <span className="uppercase">{producto.unidad}</span>
            {" · "}
            {sinStock ? "Sin stock" : formatearMoneda(producto.precio)}
          </p>
        </div>
        {yaAgregado ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-success/30 bg-success/15 text-sm font-bold text-success tabular-nums">
            {formatearCantidad(enPedido)}
          </span>
        ) : (
          <Plus className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        )}
      </button>
    </li>
  );
}
