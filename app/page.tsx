import Link from "next/link";

import { LogoPedidly } from "@/components/logo-pedidly";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { PRODUCTO } from "@/lib/branding";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <h1>
        <LogoPedidly priority className="h-16 sm:h-20" />
      </h1>
      <p className="max-w-sm text-muted-foreground">{PRODUCTO.lema}.</p>
      <Button asChild size="lg">
        <Link href="/login">Entrar</Link>
      </Button>
    </main>
  );
}
