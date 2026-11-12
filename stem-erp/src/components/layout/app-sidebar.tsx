"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CalendarClock,
  ChevronDown,
  Flag,
  FolderGit2,
  Grid3X3,
  Layers,
  LayoutDashboard,
  ListOrdered,
  Megaphone,
  MessageSquare,
  MessageSquareText,
  Network,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { AuthenticatedUserDTO } from "@/types/auth";
import { useSidebar } from "@/providers/sidebar-provider";

import { sidebarItemStyles } from "./sidebar-item-styles";
import { TaskNavGroup } from "./task-nav-group";

export const FINANCE_SUB_ITEMS = [
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

export const ROI_SUB_ITEMS = [
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

export const COMMUNICATION_SUB_ITEMS = [
  {
    href: "/comunicacao?tab=mapa",
    tabKey: "mapa",
    label: "Mapa Hierárquico",
    icon: Network,
  },
  {
    href: "/comunicacao?tab=relatorios",
    tabKey: "relatorios",
    label: "Gerador de Relatórios",
    icon: MessageSquare,
  },
  {
    href: "/comunicacao?tab=stakeholders",
    tabKey: "stakeholders",
    label: "Diretório",
    icon: Users,
  },
  {
    href: "/comunicacao?tab=agendamentos",
    tabKey: "agendamentos",
    label: "Agendamentos",
    icon: CalendarClock,
  },
  {
    href: "/comunicacao?tab=matriz",
    tabKey: "matriz",
    label: "Matriz Mendelow",
    icon: Grid3X3,
  },
] as const;

export const DOCUMENTS_SUB_ITEMS = [
  {
    href: "/documentos",
    label: "WBS / EAP",
    icon: FolderGit2,
  },
] as const;

export const TEAM_SUB_ITEMS = [
  {
    href: "/equipe",
    label: "Equipes",
    icon: Flag,
  },
  {
    href: "/integrantes",
    label: "Integrantes",
    icon: Users,
  },
  {
    href: "/permissoes",
    label: "Permissões de Acesso",
    icon: ShieldCheck,
  },
] as const;

interface AppSidebarProps {
  currentUser: AuthenticatedUserDTO;
}

export function AppSidebar({ currentUser }: AppSidebarProps) {
  const { isOpen } = useSidebar();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams ? searchParams.get("tab") : null;
  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";

  const isFinanceRouteActive = FINANCE_SUB_ITEMS.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const [isFinanceOpen, setIsFinanceOpen] = React.useState<boolean>(false);

  const isRoiRouteActive = ROI_SUB_ITEMS.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const [isRoiOpen, setIsRoiOpen] = React.useState<boolean>(false);

  const isComunicacaoRouteActive =
    pathname === "/comunicacao" || pathname.startsWith("/comunicacao/");
  const [isComunicacaoOpen, setIsComunicacaoOpen] = React.useState<boolean>(false);

  const isDocumentosRouteActive =
    pathname === "/documentos" || pathname.startsWith("/documentos/");
  const [isDocumentosOpen, setIsDocumentosOpen] = React.useState<boolean>(false);

  const permissions = currentUser.permissions ?? {
    finance: true,
    roi: true,
    communication: true,
    documents: true,
    team: isSuperAdmin,
  };

  const isEquipeRouteActive = TEAM_SUB_ITEMS.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const [isEquipeOpen, setIsEquipeOpen] = React.useState<boolean>(false);

  return (
    <aside
      aria-label="Menu Lateral"
      className={`hidden shrink-0 flex-col border-r border-border bg-card lg:flex select-none h-screen sticky top-0 overflow-hidden transition-[width,opacity] duration-300 ease-in-out ${
        isOpen
          ? "w-60 opacity-100"
          : "w-0 border-r-0 opacity-0 pointer-events-none"
      }`}
    >
      <div className="w-60 h-full flex flex-col shrink-0">
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
          {permissions.finance && (
            <div className="relative px-5">
              {isFinanceRouteActive && !isFinanceOpen && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 bottom-0 w-1.5 rounded-r-md bg-primary"
                />
              )}

              <button
                type="button"
                onClick={() => setIsFinanceOpen((prev) => !prev)}
                aria-expanded={isFinanceOpen}
                className={sidebarItemStyles({
                  isActive: isFinanceRouteActive && !isFinanceOpen,
                })}
              >
                <Wallet className="h-4 w-4 shrink-0" />
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
          )}

          {/* Combo / Grupo: ROI & Patrocínio */}
          {permissions.roi && (
            <div className="relative px-5">
              {isRoiRouteActive && !isRoiOpen && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 bottom-0 w-1.5 rounded-r-md bg-primary"
                />
              )}

              <button
                type="button"
                onClick={() => setIsRoiOpen((prev) => !prev)}
                aria-expanded={isRoiOpen}
                className={sidebarItemStyles({
                  isActive: isRoiRouteActive && !isRoiOpen,
                })}
              >
                <TrendingUp className="h-4 w-4 shrink-0" />
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
          )}

          {/* Combo / Grupo: Comunicação */}
          {permissions.communication && (
            <div className="relative px-5">
              {isComunicacaoRouteActive && !isComunicacaoOpen && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 bottom-0 w-1.5 rounded-r-md bg-primary"
                />
              )}

              <button
                type="button"
                onClick={() => setIsComunicacaoOpen((prev) => !prev)}
                aria-expanded={isComunicacaoOpen}
                className={sidebarItemStyles({
                  isActive: isComunicacaoRouteActive && !isComunicacaoOpen,
                })}
              >
                <MessageSquareText className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">Comunicação</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                    isComunicacaoOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isComunicacaoOpen && (
                <div className="mt-1 ml-4 space-y-1 border-l border-border pl-2.5">
                  {COMMUNICATION_SUB_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === "/comunicacao" &&
                      (currentTab === item.tabKey || (!currentTab && item.tabKey === "mapa"));

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
          )}

          {permissions.tasks && (
            <div className="relative px-5">
              <TaskNavGroup />
            </div>
          )}

          {/* Módulo: Gestão de Riscos */}
          {permissions.risks !== false && (
            <div className="relative px-5">
              {(pathname === "/riscos" || pathname.startsWith("/riscos/")) && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 bottom-0 w-1.5 rounded-r-md bg-primary"
                />
              )}
              <Link
                href="/riscos"
                className={sidebarItemStyles({
                  isActive:
                    pathname === "/riscos" || pathname.startsWith("/riscos/"),
                })}
              >
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">Gestão de Riscos</span>
              </Link>
            </div>
          )}

          {/* Combo / Grupo: Documentos */}
          {permissions.documents && (
            <div className="relative px-5">
              {isDocumentosRouteActive && !isDocumentosOpen && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 bottom-0 w-1.5 rounded-r-md bg-primary"
                />
              )}

              <button
                type="button"
                onClick={() => setIsDocumentosOpen((prev) => !prev)}
                aria-expanded={isDocumentosOpen}
                className={sidebarItemStyles({
                  isActive: isDocumentosRouteActive && !isDocumentosOpen,
                })}
              >
                <FolderGit2 className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">Documentos</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                    isDocumentosOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDocumentosOpen && (
                <div className="mt-1 ml-4 space-y-1 border-l border-border pl-2.5">
                  {DOCUMENTS_SUB_ITEMS.map((item) => {
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
          )}

          {/* Módulo: Equipe & Acessos */}
          {(permissions.team || isSuperAdmin) && (
            <div className="relative px-5">
              {isEquipeRouteActive && !isEquipeOpen && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 bottom-0 w-1.5 rounded-r-md bg-primary"
                />
              )}

              <button
                type="button"
                onClick={() => setIsEquipeOpen((prev) => !prev)}
                aria-expanded={isEquipeOpen}
                className={sidebarItemStyles({
                  isActive: isEquipeRouteActive && !isEquipeOpen,
                })}
              >
                <Users className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">Equipe & Acessos</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                    isEquipeOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isEquipeOpen && (
                <div className="mt-1 ml-4 space-y-1 border-l border-border pl-2.5">
                  {TEAM_SUB_ITEMS.map((item) => {
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
          )}
        </nav>
      </div>
      </div>
    </aside>
  );
}
