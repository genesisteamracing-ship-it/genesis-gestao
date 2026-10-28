"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
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
import { sidebarItemStyles } from "@/components/layout/app-sidebar";

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

interface MobileNavDrawerProps {
  currentUser: AuthenticatedUserDTO;
}

export function MobileNavDrawer({ currentUser }: MobileNavDrawerProps) {
  const [open, setOpen] = React.useState(false);
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
  const [isFinanceOpen, setIsFinanceOpen] = React.useState<boolean>(true);

  const isRoiRouteActive = ROI_SUB_ITEMS.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const [isRoiOpen, setIsRoiOpen] = React.useState<boolean>(true);

  const isEquipeActive =
    pathname === "/equipe" || pathname.startsWith("/equipe/");

  const isComunicacaoActive =
    pathname === "/comunicacao" || pathname.startsWith("/comunicacao/");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
              onClick={() => setOpen(false)}
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
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setIsFinanceOpen((prev) => !prev)}
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
                      onClick={() => setOpen(false)}
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

          {/* Grupo: ROI & Patrocínio */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setIsRoiOpen((prev) => !prev)}
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
                      onClick={() => setOpen(false)}
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

          {/* Grupo: Comunicação */}
          <Link
            href="/comunicacao"
            onClick={() => setOpen(false)}
            className={sidebarItemStyles({ isActive: isComunicacaoActive })}
          >
            <MessageSquareText className="h-4 w-4 shrink-0 text-primary" />
            <span>Comunicação</span>
          </Link>

          {/* Grupo: Equipe & Acessos (SuperAdmin) */}
          {isSuperAdmin && (
            <Link
              href="/equipe"
              onClick={() => setOpen(false)}
              className={sidebarItemStyles({ isActive: isEquipeActive })}
            >
              <Users className="h-4 w-4 shrink-0" />
              <span>Equipe & Acessos</span>
            </Link>
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
