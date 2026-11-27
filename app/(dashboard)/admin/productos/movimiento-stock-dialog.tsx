"use client";

import { PackagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductoRow } from "@/lib/data/admin";
import { EntityDialog, Field, SelectField } from "../_components/entity-dialog";
import { registrarMovimientoStock } from "./actions";

const TIPO_OPTS = [
  { value: "entrada", label: "Entrada de mercadería (suma)" },
  { value: "ajuste", label: "Ajuste por conteo (el stock queda en ese número)" },
];

/**
 * Entradas y ajustes de stock. Las salidas no se cargan acá: las registra el
 * despacho de cada pedido.
 */
export function MovimientoStockDialog({ producto }: { producto: ProductoRow }) {
  return (
    <EntityDialog
      trigger={
        <Button variant="ghost" size="icon-sm" aria-label={`Mover stock de ${producto.nombre}`}>
          <PackagePlus className="size-4" />
        </Button>
      }
      title={`Stock de ${producto.nombre}`}
      description={`Hay ${producto.stock_actual} ${producto.unidad_medida}. Las salidas se descuentan solas al despachar.`}
      action={registrarMovimientoStock}
      submitLabel="Registrar"
    >
      {(errors) => (
        <>
          <input type="hidden" name="producto_id" value={producto.id} />
          <SelectField name="tipo" label="Tipo" errors={errors} options={TIPO_OPTS} defaultValue="entrada" />
          <Field label="Cantidad" name="cantidad" errors={errors}>
            <Input id="cantidad" name="cantidad" type="number" inputMode="decimal" min={0} step="any" required />
          </Field>
          <Field label="Motivo" name="motivo" errors={errors} hint="Opcional. Ej.: factura del proveedor, conteo mensual.">
            <Input id="motivo" name="motivo" maxLength={200} />
          </Field>
        </>
      )}
    </EntityDialog>
  );
}
