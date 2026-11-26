import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Píldora de estado del tablero. Los colores salen de los tokens de
 * globals.css (today / overdue / success / manual) para que funcionen en
 * tema claro y oscuro sin repetir clases en cada tarjeta.
 */
const insignia = cva(
  "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      tono: {
        hoy: "border-today/30 bg-today/15 text-today",
        vencido: "border-overdue/30 bg-overdue/15 text-overdue",
        proximo: "border-border bg-muted text-muted-foreground",
        pasado: "border-border bg-muted text-muted-foreground",
        despachado: "border-success/30 bg-success/15 text-success",
        manual: "border-manual/25 bg-manual/15 text-manual",
        portal: "border-primary/25 bg-primary/10 text-primary",
      },
    },
  },
);

export type TonoInsignia = NonNullable<VariantProps<typeof insignia>["tono"]>;

export function Insignia({
  tono,
  className,
  ...props
}: React.ComponentProps<"span"> & { tono: TonoInsignia }) {
  return <span className={cn(insignia({ tono }), className)} {...props} />;
}
