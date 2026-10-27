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
  TrendingUp,
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
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";

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
      <div className="flex min-h-[60px] sm:min-h-[70px] items-center justify-between gap-2.5 sm:gap-4 px-3 sm:px-6 lg:px-8 py-2">
        {/* Menu Hambúrguer Mobile + Logo Mobile + Indicador/Seletor de Equipe */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          {/* Botão Hambúrguer Mobile */}
          <MobileNavDrawer currentUser={currentUser} />

          {/* Logo Mobile */}
          <Link
            href="/dashboard"
            className="text-base sm:text-lg font-extrabold tracking-tight lg:hidden shrink-0"
          >
            <span className="text-primary">Genesis</span>
            <span className="text-foreground">Gestão</span>
          </Link>

          {/* Seletor de Equipe ou Badge de Isolamento Multi-Equipe */}
          <div className="flex items-center min-w-0">
            {isSuperAdmin && availableTeams.length > 0 ? (
              <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-border bg-muted px-2 sm:px-3 py-1 min-w-0">
                <Flag className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="hidden sm:inline text-xs font-bold text-muted-foreground shrink-0">
                  Equipe:
                </span>
                <Select
                  value={activeTeam?.id ?? currentUser.teamId ?? ""}
                  onValueChange={handleTeamChange}
                  disabled={isSwitchingTeam}
                >
                  <SelectTrigger className="h-7 w-[130px] sm:w-[170px] border-0 bg-card px-2 text-xs font-bold text-foreground shadow-none truncate">
                    <SelectValue placeholder="Equipe" />
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
              <Badge variant="purple" className="gap-1.5 px-2.5 py-1 text-xs truncate max-w-[200px] sm:max-w-none">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {activeTeam?.name ?? currentUser.teamName ?? "Equipe"}
                  <span className="hidden sm:inline">
                    {currentUser.deliveryGroup
                      ? ` • Setor: ${DELIVERY_GROUP_SHORT_LABELS[currentUser.deliveryGroup]}`
                      : ""}
                  </span>
                </span>
              </Badge>
            )}
          </div>
        </div>

        {/* Theme Toggle + Perfil com Dropdown */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 sm:gap-3 rounded-xl border border-transparent p-1 sm:p-1.5 text-left transition-colors hover:border-border hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
              >
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs sm:text-sm font-bold text-primary">
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
    </header>
  );
}
