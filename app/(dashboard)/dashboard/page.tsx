import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, Clock, Receipt, Truck, Users } from "lucide-react";

import { exigirPermiso } from "@/lib/auth/acceso";
import { contarClientesActivos, getPedidosReporte } from "@/lib/data/reportes";
import { listProductos } from "@/lib/data/admin";
import { FLUJO_ESTADOS, type EstadoPedido } from "@/lib/data/pedidos";
import { hoyISO, sumarDias } from "@/lib/portal/fechas";
import type { FechaISO } from "@/lib/portal/types";
import { ESTADO_LABEL } from "@/components/estado-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const formatoMoneda = new Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL" });
const formatoNumero = new Intl.NumberFormat("es-HN");
const formatoDiaCorto = new Intl.DateTimeFormat("es-HN", { timeZone: "UTC", day: "2-digit", month: "short" });

/** Honduras no tiene horario de verano: siempre UTC-6. */
const DESFASE_HONDURAS = "-06:00";

const PERIODOS = [
  { dias: 7, etiqueta: "7 días" },
  { dias: 30, etiqueta: "30 días" },
  { dias: 90, etiqueta: "90 días" },
] as const;
type Dias = (typeof PERIODOS)[number]["dias"];
const PERIODO_INICIAL: Dias = 30;

const ESTADOS_DASHBOARD: EstadoPedido[] = [...FLUJO_ESTADOS, "anulado"];
const SALIERON: ReadonlySet<EstadoPedido> = new Set(["despachado", "entregado"]);

const ESTADO_BAR_CLASS: Record<EstadoPedido, string> = {
  pendiente: "bg-neutral-400",
  confirmado: "bg-blue-500",
  en_preparacion: "bg-amber-500",
  despachado: "bg-purple-500",
  entregado: "bg-green-500",
  anulado: "bg-red-500",
};

function aPeriodo(valor: string | undefined): Dias {
  return PERIODOS.find((p) => String(p.dias) === valor)?.dias ?? PERIODO_INICIAL;
}

function porcentaje(parte: number, total: number): string {
  return total > 0 ? `${Math.round((parte / total) * 100)} %` : "—";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const sesion = await exigirPermiso("ver_dashboard");
  const dias = aPeriodo((await searchParams).periodo);

  // Días de calendario en la hora de Honduras, no la del servidor.
  const hoy = hoyISO();
  const desde = sumarDias(hoy, -(dias - 1));

  const [pedidos, productos, clientesActivos] = await Promise.all([
    getPedidosReporte(sesion.id, { desde: `${desde}T00:00:00${DESFASE_HONDURAS}` }),
    listProductos(sesion.id),
    contarClientesActivos(sesion.id),
  ]);

  const validos = pedidos.filter((p) => p.estado !== "anulado");
  const salieron = validos.filter((p) => SALIERON.has(p.estado));
  const porSalir = validos.filter((p) => !SALIERON.has(p.estado));
  const suma = (lista: typeof pedidos) => lista.reduce((total, p) => total + p.total, 0);

  const ingresado = suma(validos);
  const despachado = suma(salieron);
  const pendiente = suma(porSalir);
  const ticketPromedio = validos.length ? ingresado / validos.length : 0;
  const clientesQueCompraron = new Set(validos.map((p) => p.cliente?.id).filter(Boolean)).size;

  // Barras por día (o por semana si el período es largo), separando lo que ya salió.
  const diasPorBarra = dias > 31 ? 7 : 1;
  const barras = Array.from({ length: Math.ceil(dias / diasPorBarra) }, (_, i) => {
    const inicio = sumarDias(desde, i * diasPorBarra);
    return { inicio, fin: sumarDias(inicio, diasPorBarra - 1), salio: 0, porSalir: 0 };
  });
  for (const p of validos) {
    const dia: FechaISO = hoyISO(new Date(p.fecha_pedido));
    const barra = barras.find((b) => dia >= b.inicio && dia <= b.fin);
    if (!barra) continue;
    if (SALIERON.has(p.estado)) barra.salio += p.total;
    else barra.porSalir += p.total;
  }
  const maxBarra = Math.max(1, ...barras.map((b) => b.salio + b.porSalir));
  const etiquetaBarra = (b: (typeof barras)[number]) =>
    formatoDiaCorto.format(new Date(`${b.inicio}T00:00:00Z`));

  const porEstado = ESTADOS_DASHBOARD.map((estado) => ({
    estado,
    cantidad: pedidos.filter((p) => p.estado === estado).length,
  }));
  const maxPorEstado = Math.max(1, ...porEstado.map((e) => e.cantidad));

  const clientesMap = new Map<number, { nombre: string; total: number }>();
  for (const p of validos) {
    if (!p.cliente) continue;
    const actual = clientesMap.get(p.cliente.id) ?? { nombre: p.cliente.nombre_negocio, total: 0 };
    actual.total += p.total;
    clientesMap.set(p.cliente.id, actual);
  }
  const topClientes = [...clientesMap.values()].sort((a, b) => b.total - a.total).slice(0, 5);
  const maxCliente = Math.max(1, ...topClientes.map((c) => c.total));

  const productosMap = new Map<string, number>();
  for (const item of validos.flatMap((p) => p.items)) {
    const nombre = item.producto?.nombre ?? "Producto eliminado";
    productosMap.set(nombre, (productosMap.get(nombre) ?? 0) + item.cantidad);
  }
  const topProductos = [...productosMap]
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);
  const maxProducto = Math.max(1, ...topProductos.map((p) => p.cantidad));

  const stockBajo = productos
    .filter((p) => p.activo && p.stock_actual <= p.stock_minimo)
    .sort((a, b) => a.stock_actual - b.stock_actual);

  const kpis = [
    {
      label: "Pedidos ingresados",
      value: formatoMoneda.format(ingresado),
      detalle: `${formatoNumero.format(validos.length)} pedidos · ticket promedio ${formatoMoneda.format(ticketPromedio)}`,
      icon: Receipt,
    },
    {
      label: "Despachado y entregado",
      value: formatoMoneda.format(despachado),
      detalle: `${porcentaje(despachado, ingresado)} de lo ingresado ya salió de bodega`,
      icon: Truck,
    },
    {
      label: "Por despachar",
      value: formatoMoneda.format(pendiente),
      detalle: `${formatoNumero.format(porSalir.length)} pedidos todavía en bodega`,
      icon: Clock,
    },
    {
      label: "Clientes que pidieron",
      value: formatoNumero.format(clientesQueCompraron),
      detalle: `de ${formatoNumero.format(clientesActivos)} clientes activos (${porcentaje(clientesQueCompraron, clientesActivos)})`,
      icon: Users,
    },
  ];

  return (
    <main className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Pedidos de {sesion.nombreEmpresa} tomados en los últimos {dias} días (sin anulados).
            Todavía no es facturación: una venta cuenta cuando el pedido sale de bodega.
          </p>
        </div>
        <nav aria-label="Período" className="flex rounded-lg border bg-card p-0.5">
          {PERIODOS.map((p) => (
            <Link
              key={p.dias}
              href={p.dias === PERIODO_INICIAL ? "/dashboard" : `/dashboard?periodo=${p.dias}`}
              aria-current={p.dias === dias ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                p.dias === dias
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {p.etiqueta}
            </Link>
          ))}
        </nav>
      </div>

      {pedidos.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No hay pedidos en los últimos {dias} días.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map(({ label, value, detalle, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="flex items-start gap-3 py-1">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="truncate text-lg font-semibold tabular-nums text-foreground">{value}</p>
                    <p className="text-xs text-muted-foreground">{detalle}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle role="heading" aria-level={2}>
                  Pedidos por {diasPorBarra === 1 ? "día" : "semana"}
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>Monto según el día en que se tomó el pedido.</span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-primary" aria-hidden /> Ya salió
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-primary/30" aria-hidden /> Por despachar
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-40 items-end gap-1">
                  {barras.map((b) => {
                    const total = b.salio + b.porSalir;
                    return (
                      <div key={b.inicio} className="group flex min-w-0 flex-1 flex-col items-center gap-1">
                        <div
                          className="flex h-32 w-full flex-col justify-end"
                          title={`${etiquetaBarra(b)}: ${formatoMoneda.format(total)} (${formatoMoneda.format(b.salio)} ya salió)`}
                          aria-hidden="true"
                        >
                          {total > 0 && (
                            <div
                              className="flex w-full flex-col overflow-hidden rounded-t-sm"
                              style={{ height: `${Math.max(3, (total / maxBarra) * 100)}%` }}
                            >
                              <div className="bg-primary/30" style={{ flexGrow: b.porSalir }} />
                              <div className="bg-primary" style={{ flexGrow: b.salio }} />
                            </div>
                          )}
                        </div>
                        <span className="truncate text-[10px] text-muted-foreground">
                          {etiquetaBarra(b)}
                          <span className="sr-only">
                            {" "}
                            — {formatoMoneda.format(total)}, de eso {formatoMoneda.format(b.salio)} ya salió
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle role="heading" aria-level={2}>
                  Pedidos por estado
                </CardTitle>
                <CardDescription>Tomados en el período, incluye anulados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {porEstado.map(({ estado, cantidad }) => (
                  <div key={estado} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{ESTADO_LABEL[estado]}</span>
                      <span className="font-medium tabular-nums text-foreground">{cantidad}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${ESTADO_BAR_CLASS[estado]}`}
                        style={{ width: `${Math.max(cantidad ? 4 : 0, (cantidad / maxPorEstado) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle role="heading" aria-level={2}>
                  Top clientes
                </CardTitle>
                <CardDescription>Por monto pedido en el período</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topClientes.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin datos en el período.</p>
                )}
                {topClientes.map((c) => (
                  <div key={c.nombre} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate font-medium text-foreground">{c.nombre}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {formatoMoneda.format(c.total)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(c.total / maxCliente) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle role="heading" aria-level={2}>
                  Top productos
                </CardTitle>
                <CardDescription>Por unidades pedidas en el período</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topProductos.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin datos en el período.</p>
                )}
                {topProductos.map((p) => (
                  <div key={p.nombre} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate font-medium text-foreground">{p.nombre}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {formatoNumero.format(p.cantidad)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-secondary-foreground/70"
                        style={{ width: `${(p.cantidad / maxProducto) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle role="heading" aria-level={2} className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-500" aria-hidden />
                  Stock bajo
                </CardTitle>
                <CardDescription>
                  En o debajo del mínimo. Baja sola al despachar; las entradas se cargan en Admin → Productos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {stockBajo.length === 0 && (
                  <p className="text-sm text-muted-foreground">Ningún producto está en o debajo del mínimo.</p>
                )}
                {stockBajo.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-foreground">{p.nombre}</span>
                    <span
                      className={cn(
                        "shrink-0 tabular-nums",
                        p.stock_actual <= 0 ? "font-semibold text-destructive" : "text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {p.stock_actual <= 0 ? `Sin existencias (${p.stock_actual})` : `${p.stock_actual} / mín. ${p.stock_minimo}`}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </main>
  );
}
