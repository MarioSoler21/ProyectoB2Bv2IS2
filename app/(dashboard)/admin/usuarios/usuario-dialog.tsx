"use client";

import { Plus, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROLES } from "@/lib/validation/admin";
import { ROL_LABEL } from "@/lib/admin-labels";
import type { UsuarioRow } from "@/lib/data/admin";
import {
  EntityDialog,
  Field,
  SelectField,
  SwitchField,
} from "../_components/entity-dialog";
import { crearUsuario, actualizarUsuario } from "./actions";

const ROL_OPTS = ROLES.map((r) => ({ value: r, label: ROL_LABEL[r] }));

export function UsuarioDialog({ usuario }: { usuario?: UsuarioRow }) {
  const editar = !!usuario;
  return (
    <EntityDialog
      trigger={
        editar ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Editar ${usuario.nombre}`}>
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="size-4" />
            Nuevo usuario
          </Button>
        )
      }
      title={editar ? "Editar usuario" : "Nuevo usuario"}
      action={editar ? actualizarUsuario : crearUsuario}
    >
      {(errors) => (
        <>
          {editar && <input type="hidden" name="id" value={usuario.id} />}
          <Field label="Nombre" name="nombre" errors={errors}>
            <Input
              id="nombre"
              name="nombre"
              defaultValue={usuario?.nombre ?? ""}
              required
            />
          </Field>
          <SelectField
            name="rol"
            label="Rol"
            errors={errors}
            options={ROL_OPTS}
            defaultValue={usuario?.rol ?? "vendedor"}
          />
          <Field label="Teléfono" name="telefono" errors={errors}>
            <Input
              id="telefono"
              name="telefono"
              defaultValue={usuario?.telefono ?? ""}
            />
          </Field>
          <Field
            label="Correo"
            name="email"
            errors={errors}
            hint="Con este correo entra al panel. Obligatorio para admin, vendedor y despacho."
          >
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="off"
              defaultValue={usuario?.email ?? ""}
            />
          </Field>
          <Field
            label={editar && usuario.auth_user_id ? "Nueva contraseña" : "Contraseña inicial"}
            name="password"
            errors={errors}
            hint={
              editar && usuario.auth_user_id
                ? "Déjala vacía para no cambiarla."
                : "Mínimo 8 caracteres. Entrégasela a la persona por un medio seguro."
            }
          >
            <Input id="password" name="password" type="password" autoComplete="new-password" />
          </Field>
          <Field
            label={usuario?.tiene_pin ? "Nuevo PIN" : "PIN"}
            name="pin"
            errors={errors}
            hint={
              usuario?.tiene_pin
                ? "Ya tiene un PIN. Déjalo vacío para mantenerlo."
                : "De 4 a 6 dígitos, para el operador de bodega. Se guarda cifrado."
            }
          >
            <Input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
            />
          </Field>
          <SwitchField
            name="activo"
            label="Activo"
            defaultChecked={usuario?.activo ?? true}
          />
        </>
      )}
    </EntityDialog>
  );
}
