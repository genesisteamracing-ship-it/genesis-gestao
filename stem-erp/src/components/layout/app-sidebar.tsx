"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Layers,
  LayoutDashboard,
  ListOrdered,
  Megaphone,
  MessageSquareText,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { tv } from "tailwind-variants";
import type { AuthenticatedUserDTO } from "@/types/auth";

export const sidebarItemStyles = tv({
  base: "flex w-full items-center gap-3.5 rounded-lg px-4 py-3 text-sm font-semibold transition-colors cursor-pointer",
  variants: {
    isActive: {
      true: "bg-primary text-primary-foreground shadow-xs",
      false: "text-foreground hover:bg-muted",
    },
    isSubItem: {
      true: "py-2.5 pl-4 pr-3 text-xs",
      false: "",
    },
  },
  defaultVariants: {
    isActive: false,
    isSubItem: false,
  },
});

const FINANCE_SUB_ITEMS = [
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
] as const;

const ROI_SUB_ITEMS = [
  {
    href: "/roi",
    label: "Visão Geral & Cotas",
    icon: TrendingUp,
  },
  {
    href: "/roi/acoes",
    label: "Ações de Retorno",
    icon: Megaphone,
  },
] as const;

interface AppSidebarProps {
  currentUser: AuthenticatedUserDTO;
}

export function AppSidebar({ currentUser }: AppSidebarProps) {
  const pathname = usePathname();
  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";

  const isFinanceRouteActive = FINANCE_SUB_ITEMS.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const [financeCollapsed, setFinanceCollapsed] = React.useState<boolean>(false);
  const isFinanceOpen = isFinanceRouteActive || !financeCollapsed;

  const isRoiRouteActive = ROI_SUB_ITEMS.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const [roiCollapsed, setRoiCollapsed] = React.useState<boolean>(false);
  const isRoiOpen = isRoiRouteActive || !roiCollapsed;

  const isEquipeActive =
    pathname === "/equipe" || pathname.startsWith("/equipe/");

  const isComunicacaoActive =
    pathname === "/comunicacao" || pathname.startsWith("/comunicacao/");

  return (
    <aside
      aria-label="Menu Lateral"
      className="hidden w-60 shrink-0 flex-col border-r border-border bg-card lg:flex select-none h-screen sticky top-0 transition-colors"
    >
      {/* Logo Topo */}
      <div className="flex h-[70px] shrink-0 items-center justify-center px-6 border-b border-border">
        <Link
          href="/dashboard"
          className="text-xl font-extrabold tracking-tight"
        >
          <span className="text-primary">Genesis</span>
          <span className="text-foreground">Gestão</span>
        </Link>
      </div>

      {/* Navegação dos Módulos */}
      <div className="flex-1 overflow-y-auto py-3">
        <nav className="space-y-1.5">
          {/* Combo / Grupo: Finanças */}
          <div className="relative px-5">
            {isFinanceRouteActive && !isFinanceOpen && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 bottom-0 w-1.5 rounded-r-md bg-primary"
              />
            )}

            <button
              type="button"
              onClick={() => setFinanceCollapsed((prev) => !prev)}
              aria-expanded={isFinanceOpen}
              className={sidebarItemStyles({
                isActive: isFinanceRouteActive && !isFinanceOpen,
              })}
            >
              <Wallet className="h-4 w-4 shrink-0 text-primary" />
              <span className="flex-1 text-left">Finanças</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                  isFinanceOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isFinanceOpen && (
              <div className="mt-1 ml-4 space-y-1 border-l border-border pl-2.5">
                {FINANCE_SUB_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={sidebarItemStyles({
                        isActive,
                        isSubItem: true,
                      })}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Combo / Grupo: ROI & Patrocínio */}
          <div className="relative px-5">
            {isRoiRouteActive && !isRoiOpen && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 bottom-0 w-1.5 rounded-r-md bg-primary"
              />
            )}

            <button
              type="button"
              onClick={() => setRoiCollapsed((prev) => !prev)}
              aria-expanded={isRoiOpen}
              className={sidebarItemStyles({
                isActive: isRoiRouteActive && !isRoiOpen,
              })}
            >
              <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
              <span className="flex-1 text-left">ROI</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                  isRoiOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isRoiOpen && (
              <div className="mt-1 ml-4 space-y-1 border-l border-border pl-2.5">
                {ROI_SUB_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/roi" && pathname.startsWith(`${item.href}/`)) ||
                    (item.href === "/roi" && pathname === "/roi");

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={sidebarItemStyles({
                        isActive,
                        isSubItem: true,
                      })}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Módulo: Comunicação */}
          <div className="relative px-5">
            {isComunicacaoActive && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 bottom-0 w-1.5 rounded-r-md bg-primary"
              />
            )}
            <Link
              href="/comunicacao"
              className={sidebarItemStyles({ isActive: isComunicacaoActive })}
            >
              <MessageSquareText className="h-4 w-4 shrink-0 text-primary" />
              <span>Comunicação</span>
            </Link>
          </div>

          {/* Módulo SuperAdmin: Equipe & Acessos */}
          {isSuperAdmin && (
            <div className="relative px-5">
              {isEquipeActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 bottom-0 w-1.5 rounded-r-md bg-primary"
                />
              )}
              <Link
                href="/equipe"
                className={sidebarItemStyles({ isActive: isEquipeActive })}
              >
                <Users className="h-4 w-4 shrink-0" />
                <span>Equipe & Acessos</span>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}
