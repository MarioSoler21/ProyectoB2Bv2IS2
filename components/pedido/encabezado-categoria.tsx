import { cn } from "@/lib/utils";

/** Sub-encabezado de categoría dentro de una lista de productos. */
export function EncabezadoCategoria({
  categoria,
  fijo = false,
}: {
  categoria: string;
  /** Queda pegado arriba al hacer scroll (listas largas). */
  fijo?: boolean;
}) {
  return (
    <div
      className={cn(
        "border-b bg-muted px-4 py-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase",
        fijo && "sticky top-0 z-[1]",
      )}
    >
      {categoria}
    </div>
  );
}
