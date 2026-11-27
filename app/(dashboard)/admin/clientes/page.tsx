import { exigirPermiso } from "@/lib/auth/acceso";
import { listClientes, listVendedores, listZonas } from "@/lib/data/admin";
import { TIPO_CLIENTE_LABEL } from "@/lib/admin-labels";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminTabs } from "../_components/admin-tabs";
import { ActivoToggle } from "../_components/activo-toggle";
import { ClienteDialog } from "./cliente-dialog";
import { TokenCell } from "./token-cell";
import { setActivoCliente } from "./actions";

export default async function ClientesAdminPage() {
  const tenant = await exigirPermiso("administrar");
  const [clientes, zonas, vendedores] = await Promise.all([
    listClientes(tenant.id),
    listZonas(tenant.id),
    listVendedores(tenant.id),
  ]);

  const zonaNombre = new Map(zonas.map((z) => [z.id, z.nombre]));
  const vendedorNombre = new Map(vendedores.map((v) => [v.id, v.nombre]));
  const sinVendedor = clientes.filter((c) => c.activo && c.vendedor_id === null).length;

  return (
    <main className="p-6 lg:p-8">
      <AdminTabs />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Clientes
          </h1>
          <p className="text-sm text-muted-foreground">
            {clientes.length} en {tenant.nombreEmpresa}
            {sinVendedor > 0 && ` · ${sinVendedor} activos sin vendedor (ningún vendedor los ve)`}
          </p>
        </div>
        <ClienteDialog zonas={zonas} vendedores={vendedores} />
      </div>

      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Negocio</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Portal</TableHead>
              <TableHead className="w-20">Activo</TableHead>
              <TableHead className="w-16 text-right">Editar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Sin clientes todavía.
                </TableCell>
              </TableRow>
            )}
            {clientes.map((c) => (
              <TableRow key={c.id} className={c.activo ? "" : "opacity-55"}>
                <TableCell className="font-medium text-foreground">
                  {c.nombre_negocio}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.nombre_contacto ?? "—"}
                  {c.telefono ? ` · ${c.telefono}` : ""}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.zona_id ? (zonaNombre.get(c.zona_id) ?? "—") : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.vendedor_id ? (
                    (vendedorNombre.get(c.vendedor_id) ?? "Vendedor inactivo")
                  ) : (
                    <span className="italic">Sin asignar</span>
                  )}
                </TableCell>
                <TableCell>
                  {c.tipo_cliente ? (
                    <Badge variant="outline">
                      {TIPO_CLIENTE_LABEL[c.tipo_cliente] ?? c.tipo_cliente}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <TokenCell id={c.id} token={c.token_unico} />
                </TableCell>
                <TableCell>
                  <ActivoToggle
                    id={c.id}
                    activo={c.activo}
                    action={setActivoCliente}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <ClienteDialog cliente={c} zonas={zonas} vendedores={vendedores} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
