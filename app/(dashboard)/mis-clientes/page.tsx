import Link from "next/link";
import { CircleCheck, Phone, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { exigirPermiso } from "@/lib/auth/acceso";
import { puede } from "@/lib/auth/permisos";
import { getCartera } from "@/lib/data/catalogo";

export default async function MisClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ creado?: string }>;
}) {
  const { creado } = await searchParams;
  const numeroCreado = /^\d+$/.test(creado ?? "") ? creado : null;
  const tenant = await exigirPermiso("tomar_pedidos");
  const clientes = await getCartera(tenant);
  const veTodos = puede(tenant.rol, "ver_todos_los_clientes");

  return (
    <main className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Mis clientes
        </h1>
        <p className="text-sm text-muted-foreground">
          {veTodos
            ? `Todos los clientes activos de ${tenant.nombreEmpresa}.`
            : "Los clientes que tienes asignados."}{" "}
          Elige uno para hacerle un pedido.
        </p>
      </div>

      {numeroCreado && (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          <CircleCheck className="size-4 shrink-0" aria-hidden />
          Pedido #{numeroCreado} creado y confirmado. Ya aparece en despacho.
        </p>
      )}

      {clientes.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {veTodos
            ? "Todavía no hay clientes activos. Agrégalos en Admin → Clientes."
            : "Todavía no tienes clientes asignados. Pídele al administrador que te asigne tu cartera."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clientes.map((cliente) => (
            <Card key={cliente.id} className="justify-between">
              <CardHeader>
                <CardTitle>{cliente.nombre_negocio}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm text-muted-foreground">
                {cliente.nombre_contacto && (
                  <p className="flex items-center gap-2">
                    <User className="size-3.5 shrink-0" aria-hidden />
                    {cliente.nombre_contacto}
                  </p>
                )}
                {cliente.telefono && (
                  <p className="flex items-center gap-2">
                    <Phone className="size-3.5 shrink-0" aria-hidden />
                    {cliente.telefono}
                  </p>
                )}
              </CardContent>
              <CardContent>
                <Button asChild size="sm" className="w-full">
                  <Link href={`/mis-clientes/${cliente.id}/pedido`}>
                    Nuevo pedido
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
