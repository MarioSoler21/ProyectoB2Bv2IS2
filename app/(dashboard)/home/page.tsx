import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  Truck,
  Settings,
  BarChart3,
  Download,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROL_LABEL } from "@/lib/admin-labels";
import { seccionesPermitidas, type HrefSeccion } from "@/lib/auth/permisos";
import { getSession } from "@/lib/session";

const ACCESOS: Record<HrefSeccion, { label: string; desc: string; icon: LucideIcon }> = {
  "/mis-clientes": { label: "Mis clientes", desc: "Tu cartera y nuevo pedido", icon: Users },
  "/despacho": { label: "Despacho", desc: "Confirmar, preparar, despachar y entregar", icon: Truck },
  "/admin": { label: "Admin", desc: "Usuarios, clientes, catálogo y stock", icon: Settings },
  "/dashboard": { label: "Dashboard", desc: "Cómo va el negocio", icon: BarChart3 },
  "/descargas": { label: "Descargas", desc: "Reportes de pedidos en PDF o CSV", icon: Download },
};

export default async function HomePage() {
  const sesion = await getSession();
  if (!sesion) redirect("/login");

  const secciones = seccionesPermitidas(sesion.rol);

  return (
    <main className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Hola, {sesion.usuarioNombre}
        </h1>
        <p className="text-sm text-muted-foreground">
          {sesion.nombreEmpresa} · {ROL_LABEL[sesion.rol] ?? sesion.rol}
        </p>
      </div>

      {secciones.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Tu rol todavía no tiene secciones en el panel. Si crees que es un error,
          habla con el administrador de tu empresa.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {secciones.map((href) => {
            const { label, desc, icon: Icon } = ACCESOS[href];
            return (
              <Link key={href} href={href} className="group block">
                <Card className="h-full transition-colors group-hover:bg-muted/50">
                  <CardHeader>
                    <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-foreground/10">
                      <Icon className="size-4.5" aria-hidden />
                    </div>
                    <CardTitle className="flex items-center justify-between">
                      {label}
                      <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </CardTitle>
                    <CardDescription>{desc}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
