"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import {
  ChevronDown,
  Flag,
  Layers,
  LayoutDashboard,
  ListOrdered,
  Lock,
  LogOut,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  logoutAction,
  switchSuperAdminTeamAction,
} from "@/actions/auth-actions";
import { DELIVERY_GROUP_SHORT_LABELS, USER_ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
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
  const router = useRouter();
  const [isSwitchingTeam, startTransition] = React.useTransition();

  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";
  const initials = currentUser.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleTeamChange(newTeamId: string) {
    startTransition(async () => {
      const res = await switchSuperAdminTeamAction(newTeamId);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      router.refresh();
    });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#E8E8E8] bg-white">
      <div className="flex min-h-[70px] flex-wrap items-center justify-between gap-4 px-6 py-2.5 lg:px-8">
        {/* Logo Mobile + Indicador/Seletor de Equipe */}
        <div className="flex flex-1 items-center gap-4">
          <Link
            href="/dashboard"
            className="text-lg font-extrabold tracking-tight lg:hidden"
          >
            <span className="text-[#4880FF]">Genesis</span>
            <span className="text-[#202224]">Gestão</span>
          </Link>

          {/* Seletor de Equipe (SuperAdmin) ou Badge de Isolamento Multi-Equipe */}
          <div className="flex items-center gap-2">
            {isSuperAdmin && availableTeams.length > 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-[#D5D5D5] bg-[#F5F6FA] px-3 py-1">
                <Flag className="h-3.5 w-3.5 text-[#4880FF]" />
                <span className="text-xs font-bold text-[#606060]">
                  Equipe Ativa:
                </span>
                <Select
                  value={activeTeam?.id ?? currentUser.teamId ?? ""}
                  onValueChange={handleTeamChange}
                  disabled={isSwitchingTeam}
                >
                  <SelectTrigger className="h-7 w-[170px] border-0 bg-white px-2.5 text-xs font-bold text-[#202224] shadow-none">
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

        {/* Perfil Autenticado com Dropdown Menu (Nome + Dropdown com Sair) */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-3 rounded-xl border border-transparent p-1.5 text-left transition-colors hover:border-[#E8E8E8] hover:bg-[#F5F6FA] focus:outline-none focus:ring-2 focus:ring-[#4880FF]/20 cursor-pointer"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4880FF]/15 text-sm font-bold text-[#4880FF]">
                  {initials}
                </div>
                <div className="hidden text-left leading-tight md:block">
                  <div className="text-sm font-bold text-[#202224]">
                    {currentUser.name}
                  </div>
                  <div className="text-xs font-medium text-[#565656]">
                    {currentUser.teamName ?? "Global"} •{" "}
                    {currentUser.jobTitle || USER_ROLE_LABELS[currentUser.role]}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-[#202224]/50 transition-transform duration-200" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none text-[#202224]">
                    {currentUser.name}
                  </p>
                  <p className="text-xs leading-none text-[#606060]">
                    {currentUser.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <div className="px-3 py-2 text-xs text-[#606060] space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-[#202224]">
                  <User className="h-3.5 w-3.5 text-[#4880FF]" />
                  <span>{USER_ROLE_LABELS[currentUser.role]}</span>
                </div>
                <div>{currentUser.teamName ?? "Sem Equipe Definida"}</div>
              </div>

              <DropdownMenuSeparator />

              <form action={logoutAction} className="w-full">
                <DropdownMenuItem asChild>
                  <button
                    type="submit"
                    className="w-full text-[#EF3826] focus:bg-red-50 focus:text-[#EF3826] cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 text-[#EF3826]" />
                    <span>Sair</span>
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Barra de navegação rápida no Mobile */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E8E8E8] px-4 py-2 lg:hidden">
        <div className="flex items-center gap-1.5">
          <Link
            href="/dashboard"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold",
              pathname === "/dashboard"
                ? "bg-[#4880FF] text-white"
                : "text-[#202224] hover:bg-[#F5F6FA]"
            )}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/planejamento"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold",
              pathname === "/planejamento"
                ? "bg-[#4880FF] text-white"
                : "text-[#202224] hover:bg-[#F5F6FA]"
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Planejamento</span>
          </Link>
          <Link
            href="/lancamentos"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold",
              pathname === "/lancamentos"
                ? "bg-[#4880FF] text-white"
                : "text-[#202224] hover:bg-[#F5F6FA]"
            )}
          >
            <ListOrdered className="h-3.5 w-3.5" />
            <span>Livro Caixa</span>
          </Link>
          {isSuperAdmin && (
            <Link
              href="/equipe"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold",
                pathname === "/equipe"
                  ? "bg-[#4880FF] text-white"
                  : "text-[#202224] hover:bg-[#F5F6FA]"
              )}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Equipes</span>
            </Link>
          )}
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#EF3826] hover:bg-red-50 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair</span>
          </button>
        </form>
      </div>
    </header>
  );
}
