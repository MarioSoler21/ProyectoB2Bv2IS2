"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PLAN_LABEL } from "@/lib/admin-labels";
import { toBranding } from "@/lib/branding";
import type { TenantRow } from "@/lib/data/admin";
import type { FormState } from "@/lib/validation/admin";
import { Field } from "../_components/entity-dialog";
import { SubmitButton } from "../_components/submit-button";
import { BrandingSection } from "./branding-colors";
import { actualizarConfiguracion } from "./actions";

const initial: FormState = { ok: false };

export function ConfigForm({ tenant }: { tenant: TenantRow }) {
  const [state, formAction] = useActionState(actualizarConfiguracion, initial);
  const branding = toBranding(tenant);

  useEffect(() => {
    if (state.ok) toast.success("Configuración guardada.");
    else if (state.error && !state.fieldErrors) toast.error(state.error);
  }, [state]);

  const errs = state.fieldErrors;

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Datos</h2>
        <Field label="Nombre de la empresa" name="nombre_empresa" errors={errs}>
          <Input
            id="nombre_empresa"
            name="nombre_empresa"
            defaultValue={tenant.nombre_empresa}
            required
          />
        </Field>
        <dl className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Plan</dt>
            <dd className="font-medium">{PLAN_LABEL[tenant.plan] ?? tenant.plan}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Identificador de la cuenta</dt>
            <dd className="font-mono text-xs">{tenant.slug}</dd>
          </div>
          <p className="col-span-2 text-xs text-muted-foreground">
            Para cambiar de plan, escríbele al equipo de Pedidly.
          </p>
        </dl>
      </section>

      <Separator />

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Marca</h2>
          <p className="text-xs text-muted-foreground">
            Se aplica al menú lateral y al portal de cliente.
          </p>
        </div>
        <BrandingSection
          errors={errs}
          nombreEmpresa={branding.nombreEmpresa}
          nombreApp={tenant.nombre_app}
          subtituloApp={tenant.subtitulo_app}
          primario={branding.colorPrimario}
          secundario={branding.colorSecundario}
          sidebar={branding.colorSidebar}
          logoUrl={branding.logoUrl}
        />

        <Field
          label="Mensaje del portal de cliente"
          name="mensaje_portal"
          errors={errs}
          hint="Lo ven tus clientes al abrir su link de pedidos, antes de armar el pedido."
        >
          <Textarea
            id="mensaje_portal"
            name="mensaje_portal"
            rows={2}
            defaultValue={tenant.mensaje_portal ?? ""}
          />
        </Field>
      </section>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <SubmitButton>Guardar cambios</SubmitButton>
    </form>
  );
}
