import { redirect } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { CREDENCIALES_FAKE, FAKE_LOGIN_ENABLED } from "@/lib/auth/fake-login";
import { getSession } from "@/lib/session";
import { inicioDeRol } from "@/lib/auth/permisos";
import { LogoPedidly } from "@/components/logo-pedidly";
import { PRODUCTO } from "@/lib/branding";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(inicioDeRol(session.rol));
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1>
            <LogoPedidly priority className="h-12" />
          </h1>
          <p className="text-sm text-muted-foreground">{PRODUCTO.lema}</p>
        </div>
        <LoginForm credencialesDemo={FAKE_LOGIN_ENABLED ? CREDENCIALES_FAKE : undefined} />
      </div>
    </main>
  );
}
