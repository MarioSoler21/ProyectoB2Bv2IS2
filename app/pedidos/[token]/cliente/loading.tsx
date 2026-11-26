import { Skeleton } from "@/components/ui/skeleton";

/** Esqueleto mientras el servidor resuelve el token y trae los pedidos. */
export default function CargandoPortal() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-5" aria-busy="true" aria-label="Cargando">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-17 shrink-0 rounded-xl" />
        ))}
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="space-y-3 rounded-2xl border bg-card p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-40" />
        </div>
      ))}
    </div>
  );
}
