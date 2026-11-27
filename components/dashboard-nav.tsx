"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Truck,
  Settings,
  BarChart3,
  Download,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/home", label: "Inicio", icon: Home },
  { href: "/mis-clientes", label: "Mis clientes", icon: Users },
  { href: "/despacho", label: "Despacho", icon: Truck },
  { href: "/admin", label: "Admin", icon: Settings },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/descargas", label: "Descargas", icon: Download },
];

/** Menú del panel. `permitidas` sale del rol (lib/auth/permisos.ts); Inicio siempre está. */
export function DashboardNav({ permitidas }: { permitidas: readonly string[] }) {
  const pathname = usePathname();
  const visibles = NAV.filter((item) => item.href === "/home" || permitidas.includes(item.href));

  return (
    <nav className="flex flex-col gap-0.5">
      {visibles.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
