"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import {
  Flag,
  Layers,
  LayoutDashboard,
  ListOrdered,
  Lock,
  LogOut,
  Search,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateBudgetResourceDialog } from "@/components/modals/create-budget-resource-dialog";
import { CreateTransactionDialog } from "@/components/modals/create-transaction-dialog";

interface AppHeaderProps {
  currentUser: AuthenticatedUserDTO;
  activeTeam?: ActiveTeamSummaryDTO;
  availableTeams?: ActiveTeamSummaryDTO[];
  categories: CategoryDTO[];
  budgetResources: BudgetResourceDTO[];
}

export function AppHeader({
  currentUser,
  activeTeam,
  availableTeams = [],
  categories,
  budgetResources,
}: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSwitchingTeam, startTransition] = React.useTransition();

  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";
  const initials = currentUser.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    if (pathname !== "/lancamentos" && pathname !== "/planejamento") {
      router.push("/lancamentos");
    }
  }

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
        {/* Busca estilo DashStack + Indicador/Seletor de Equipe */}
        <div className="flex flex-1 items-center gap-4">
          <Link
            href="/dashboard"
            className="text-lg font-extrabold tracking-tight lg:hidden"
          >
            <span className="text-[#4880FF]">Genesis</span>
            <span className="text-[#202224]">Gestão</span>
          </Link>

          <form
            onSubmit={handleSearchSubmit}
            className="relative hidden w-full max-w-[300px] sm:block"
          >
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#202224]/40" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar recursos, NF-e ou patrocínios..."
              className="h-[38px] w-full rounded-full border border-[#D5D5D5] bg-[#F5F6FA] pl-11 pr-4 text-sm text-[#202224] placeholder:text-[#202224]/50 focus:border-[#4880FF] focus:bg-white focus:outline-none transition-colors"
            />
          </form>

          {/* Seletor de Equipe (SuperAdmin) ou Badge de Isolamento Multi-Equipe */}
          <div className="hidden xl:flex items-center gap-2">
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

        {/* Ações Globais + Perfil Autenticado */}
        <div className="flex flex-wrap items-center gap-3">
          <CreateBudgetResourceDialog
            categories={categories}
            currentUser={currentUser}
            triggerLabel="+ Planejar Recurso"
          />
          <CreateTransactionDialog
            categories={categories}
            budgetResources={budgetResources}
            currentUser={currentUser}
            triggerLabel="+ Lançar Transação"
          />

          {/* Perfil do Usuário Autenticado */}
          <div className="hidden items-center gap-3 border-l border-[#E8E8E8] pl-4 md:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4880FF]/15 text-sm font-bold text-[#4880FF]">
              {initials}
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-[#202224]">
                {currentUser.name}
              </div>
              <div className="text-xs font-medium text-[#565656]">
                {currentUser.teamName ?? "Global"} •{" "}
                {currentUser.jobTitle || USER_ROLE_LABELS[currentUser.role]}
              </div>
            </div>
          </div>
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
