"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarRange,
  FileCheck2,
  Layers,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  PackageCheck,
  Printer,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { logoutAction } from "@/actions/auth-actions";
import { triggerPortfolioPdfPrint } from "@/lib/export-utils";
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

  const auditPagesItems = [
    {
      href: "/dashboard#fluxo-caixa",
      label: "Fluxo de Caixa",
      icon: TrendingUp,
    },
    {
      href: "/dashboard#cronograma",
      label: "Cronograma Físico",
      icon: CalendarRange,
    },
    {
      href: "/planejamento",
      label: "Estoque & Recursos",
      icon: PackageCheck,
    },
    {
      href: "/lancamentos",
      label: "Auditoria & Notas",
      icon: FileCheck2,
    },
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

      {/* Navegação Principal */}
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

        <div className="my-5 border-t border-[#E8E8E8]" />

        {/* Seção PAGES / AUDITORIA */}
        <div className="px-6 pb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#202224]/50">
            AUDITORIA STEM
          </span>
        </div>

        <nav className="space-y-1">
          {auditPagesItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="px-5">
                <Link
                  href={item.href}
                  className="flex items-center gap-3.5 rounded-lg px-4 py-2.5 text-sm font-medium text-[#202224] transition-colors hover:bg-[#F5F6FA]"
                >
                  <Icon className="h-4 w-4 shrink-0 text-[#202224]/70" />
                  <span>{item.label}</span>
                </Link>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Rodapé da Sidebar (Imprimir + Status + Logout) */}
      <div className="border-t border-[#E8E8E8] p-5 space-y-1">
        <button
          type="button"
          onClick={triggerPortfolioPdfPrint}
          className="flex w-full items-center gap-3.5 rounded-lg px-4 py-2.5 text-sm font-medium text-[#202224] transition-colors hover:bg-[#F5F6FA] cursor-pointer"
        >
          <Printer className="h-4 w-4 text-[#202224]/70" />
          <span>Imprimir Portfólio</span>
        </button>

        <div className="flex items-center gap-3.5 rounded-lg px-4 py-2 text-xs font-medium text-[#00B69B]">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Sessão httpOnly Ativa</span>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-[#EF3826] transition-colors hover:bg-red-50/70 cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Logout</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
