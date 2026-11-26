import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder mientras se lee el borrador guardado en el navegador. */
export function EsqueletoArmado() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando pedido">
      <Skeleton className="h-11 w-full rounded-xl" />
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="space-y-2 rounded-xl border bg-card p-4">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      ))}
    </div>
  );
}
