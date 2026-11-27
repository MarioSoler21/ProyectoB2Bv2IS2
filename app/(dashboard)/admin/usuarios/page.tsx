import { exigirPermiso } from "@/lib/auth/acceso";
import { listUsuarios, type UsuarioRow } from "@/lib/data/admin";
import { ROL_LABEL } from "@/lib/admin-labels";
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
import { UsuarioDialog } from "./usuario-dialog";
import { setActivoUsuario } from "./actions";

export default async function UsuariosAdminPage() {
  const tenant = await exigirPermiso("administrar");
  const usuarios = await listUsuarios(tenant.id);

  return (
    <main className="p-6 lg:p-8">
      <AdminTabs />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Usuarios
          </h1>
          <p className="text-sm text-muted-foreground">
            {usuarios.length} en {tenant.nombreEmpresa}
          </p>
        </div>
        <UsuarioDialog />
      </div>

      <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Acceso</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="w-20">Activo</TableHead>
              <TableHead className="w-16 text-right">Editar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Sin usuarios todavía.
                </TableCell>
              </TableRow>
            )}
            {usuarios.map((u) => (
              <TableRow key={u.id} className={u.activo ? "" : "opacity-55"}>
                <TableCell className="font-medium text-foreground">
                  {u.nombre}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{ROL_LABEL[u.rol] ?? u.rol}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Acceso usuario={u} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {u.telefono ?? "—"}
                </TableCell>
                <TableCell>
                  <ActivoToggle
                    id={u.id}
                    activo={u.activo}
                    action={setActivoUsuario}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <UsuarioDialog usuario={u} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}

/** Cómo entra al sistema: correo, PIN, o todavía no puede entrar. */
function Acceso({ usuario }: { usuario: UsuarioRow }) {
  if (usuario.auth_user_id) return <span>{usuario.email ?? "Con correo"}</span>;
  if (usuario.tiene_pin) return <span>Con PIN</span>;
  return (
    <span className="text-amber-700 dark:text-amber-400">Sin acceso: edítalo y ponle correo</span>
  );
}
