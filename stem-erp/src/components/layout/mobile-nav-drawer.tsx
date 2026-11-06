"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  FolderGit2,
  Layers,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Megaphone,
  Menu,
  MessageSquareText,
  Moon,
  Sun,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useTheme } from "next-themes";
import { logoutAction } from "@/actions/auth-actions";
import type { AuthenticatedUserDTO } from "@/types/auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  sidebarItemStyles,
  FINANCE_SUB_ITEMS,
  ROI_SUB_ITEMS,
  COMMUNICATION_SUB_ITEMS,
  DOCUMENTS_SUB_ITEMS,
  TEAM_SUB_ITEMS,
} from "@/components/layout/app-sidebar";
import { useSidebar } from "@/providers/sidebar-provider";

interface MobileNavDrawerProps {
  currentUser: AuthenticatedUserDTO;
}

export function MobileNavDrawer({ currentUser }: MobileNavDrawerProps) {
  const { isMobileOpen, setIsMobileOpen } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";

  const handleLogout = React.useCallback(async () => {
    try {
      await logoutAction();
    } finally {
      router.push("/login");
      router.refresh();
    }
  }, [router]);

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

  const searchParams = useSearchParams();
  const currentTab = searchParams ? searchParams.get("tab") : null;

  return (
    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 lg:hidden border-border bg-card"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[85vw] max-w-xs p-0 flex flex-col">
        {/* Topo do Drawer */}
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle asChild>
            <Link
              href="/dashboard"
              onClick={() => setIsMobileOpen(false)}
              className="text-lg font-extrabold tracking-tight"
            >
              <span className="text-primary">Genesis</span>
              <span className="text-foreground">Gestão</span>
            </Link>
          </SheetTitle>
        </SheetHeader>

        {/* Links de Navegação */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {/* Grupo: Finanças */}
          {permissions.finance && (
            <div className="space-y-1">
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
                <div className="ml-4 space-y-1 border-l border-border pl-2.5">
                  {FINANCE_SUB_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
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

          {/* Grupo: ROI & Patrocínio */}
          {permissions.roi && (
            <div className="space-y-1">
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
                <div className="ml-4 space-y-1 border-l border-border pl-2.5">
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
                        onClick={() => setIsMobileOpen(false)}
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

          {/* Grupo: Comunicação com Submódulos */}
          {permissions.communication && (
            <div className="space-y-1">
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
                <div className="ml-4 space-y-1 border-l border-border pl-2.5">
                  {COMMUNICATION_SUB_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === "/comunicacao" &&
                      (currentTab === item.tabKey || (!currentTab && item.tabKey === "mapa"));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
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

          {/* Grupo: Documentos com Submódulos */}
          {permissions.documents && (
            <div className="space-y-1">
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
                <div className="ml-4 space-y-1 border-l border-border pl-2.5">
                  {DOCUMENTS_SUB_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
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

          {/* Grupo: Equipe & Acessos */}
          {(permissions.team || isSuperAdmin) && (
            <div className="space-y-1">
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
                <div className="ml-4 space-y-1 border-l border-border pl-2.5">
                  {TEAM_SUB_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
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
        </div>

        {/* Rodapé do Drawer: Tema & Perfil */}
        <div className="p-4 border-t border-border bg-muted/30 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Tema da Interface</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-warning" />
                  <span>Claro</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5" />
                  <span>Escuro</span>
                </>
              )}
            </Button>
          </div>

          <div className="pt-2 border-t border-border/70 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground truncate">
                {currentUser.name}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {currentUser.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 text-destructive hover:bg-destructive/10 cursor-pointer"
              aria-label="Sair da conta"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
