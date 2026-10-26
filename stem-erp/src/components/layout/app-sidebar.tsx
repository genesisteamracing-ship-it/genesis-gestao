"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers,
  LayoutDashboard,
  ListOrdered,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuthenticatedUserDTO } from "@/types/auth";

interface AppSidebarProps {
  currentUser: AuthenticatedUserDTO;
}

export function AppSidebar({ currentUser }: AppSidebarProps) {
  const pathname = usePathname();
  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";

  const mainNavItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/planejamento",
      label: "Planejamento",
      icon: Layers,
    },
    {
      href: "/lancamentos",
      label: "Livro Caixa",
      icon: ListOrdered,
    },
    ...(isSuperAdmin
      ? [
          {
            href: "/equipe",
            label: "Equipe & Acessos",
            icon: Users,
          },
        ]
      : []),
  ];

  return (
    <aside
      aria-label="Menu Lateral"
      className="hidden w-60 shrink-0 flex-col border-r border-[#E8E8E8] bg-white lg:flex select-none"
    >
      {/* Logo Topo estilo DashStack */}
      <div className="flex h-[70px] items-center justify-center px-6">
        <Link href="/dashboard" className="text-xl font-extrabold tracking-tight">
          <span className="text-[#4880FF]">Genesis</span>
          <span className="text-[#202224]">Gestão</span>
        </Link>
      </div>

      {/* Navegação dos Módulos */}
      <div className="flex-1 overflow-y-auto py-3">
        <nav className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <div key={item.href} className="relative px-5">
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-0 bottom-0 w-1.5 rounded-r-md bg-[#4880FF]"
                  />
                )}
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3.5 rounded-lg px-4 py-3 text-sm font-semibold transition-all",
                    isActive
                      ? "bg-[#4880FF] text-white shadow-xs"
                      : "text-[#202224] hover:bg-[#F5F6FA]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
