"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import {
  ChevronDown,
  Flag,
  Layers,
  LayoutDashboard,
  ListOrdered,
  Lock,
  LogOut,
  Users,
} from "lucide-react";
import { tv } from "tailwind-variants";
import { DELIVERY_GROUP_SHORT_LABELS } from "@/lib/constants";
import type { AuthenticatedUserDTO } from "@/types/auth";
import type {
  ActiveTeamSummaryDTO,
  BudgetResourceDTO,
  CategoryDTO,
} from "@/types/financial";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAppHeader } from "@/components/layout/use-app-header";

export const mobileNavLinkStyles = tv({
  base: "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
  variants: {
    isActive: {
      true: "bg-primary text-primary-foreground",
      false: "text-foreground hover:bg-muted",
    },
  },
  defaultVariants: {
    isActive: false,
  },
});

interface AppHeaderProps {
  currentUser: AuthenticatedUserDTO;
  activeTeam?: ActiveTeamSummaryDTO;
  availableTeams?: ActiveTeamSummaryDTO[];
  categories?: CategoryDTO[];
  budgetResources?: BudgetResourceDTO[];
}

export function AppHeader({
  currentUser,
  activeTeam,
  availableTeams = [],
}: AppHeaderProps) {
  const pathname = usePathname();
  const {
    isSuperAdmin,
    initials,
    isSwitchingTeam,
    isLoggingOut,
    handleTeamChange,
    handleLogout,
  } = useAppHeader(currentUser);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card transition-colors">
      <div className="flex min-h-[70px] flex-wrap items-center justify-between gap-4 px-6 py-2.5 lg:px-8">
        {/* Logo Mobile + Indicador/Seletor de Equipe */}
        <div className="flex flex-1 items-center gap-4">
          <Link
            href="/dashboard"
            className="text-lg font-extrabold tracking-tight lg:hidden"
          >
            <span className="text-primary">Genesis</span>
            <span className="text-foreground">Gestão</span>
          </Link>

          {/* Seletor de Equipe ou Badge de Isolamento Multi-Equipe */}
          <div className="flex items-center gap-2">
            {isSuperAdmin && availableTeams.length > 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-1">
                <Flag className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold text-muted-foreground">
                  Equipe Ativa:
                </span>
                <Select
                  value={activeTeam?.id ?? currentUser.teamId ?? ""}
                  onValueChange={handleTeamChange}
                  disabled={isSwitchingTeam}
                >
                  <SelectTrigger className="h-7 w-[170px] border-0 bg-card px-2.5 text-xs font-bold text-foreground shadow-none">
                    <SelectValue placeholder="Selecione a equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <Badge variant="purple" className="gap-1.5 px-3 py-1">
                <Lock className="h-3.5 w-3.5" />
                <span>
                  {activeTeam?.name ?? currentUser.teamName ?? "Equipe"}
                  {currentUser.deliveryGroup
                    ? ` • Setor: ${DELIVERY_GROUP_SHORT_LABELS[currentUser.deliveryGroup]}`
                    : ""}
                </span>
              </Badge>
            )}
          </div>
        </div>

        {/* Theme Toggle + Perfil com Dropdown */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-3 rounded-xl border border-transparent p-1.5 text-left transition-colors hover:border-border hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {initials}
                </div>
                <div className="hidden text-left leading-tight md:block">
                  <div className="text-sm font-bold text-foreground">
                    {currentUser.name}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {currentUser.teamName ?? "Equipe"}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none text-foreground">
                    {currentUser.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer gap-2"
              >
                <LogOut className="h-4 w-4 text-destructive" />
                <span>{isLoggingOut ? "Saindo..." : "Sair"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Barra mobile */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2 lg:hidden">
        <div className="flex items-center gap-1.5">
          <Link
            href="/dashboard"
            className={mobileNavLinkStyles({ isActive: pathname === "/dashboard" })}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/planejamento"
            className={mobileNavLinkStyles({ isActive: pathname === "/planejamento" })}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Planejamento</span>
          </Link>
          <Link
            href="/lancamentos"
            className={mobileNavLinkStyles({ isActive: pathname === "/lancamentos" })}
          >
            <ListOrdered className="h-3.5 w-3.5" />
            <span>Livro Caixa</span>
          </Link>
          {isSuperAdmin && (
            <Link
              href="/equipe"
              className={mobileNavLinkStyles({ isActive: pathname === "/equipe" })}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Equipes</span>
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 cursor-pointer disabled:opacity-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>{isLoggingOut ? "Saindo..." : "Sair"}</span>
        </button>
      </div>
    </header>
  );
}
