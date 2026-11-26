import { Skeleton } from "@/components/ui/skeleton";

/** Esqueleto del tablero mientras el servidor trae los pedidos. */
export default function CargandoDespacho() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-4 lg:px-6" aria-busy="true" aria-label="Cargando pedidos">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-56" />
      </div>
      <Skeleton className="h-6 w-48 rounded-full" />
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="space-y-3 rounded-xl border bg-card p-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
