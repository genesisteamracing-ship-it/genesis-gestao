"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import {
  Bell,
  ChevronDown,
  Layers,
  LayoutDashboard,
  ListOrdered,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BudgetResourceDTO, CategoryDTO } from "@/types/financial";
import { CreateBudgetResourceDialog } from "@/components/modals/create-budget-resource-dialog";
import { CreateTransactionDialog } from "@/components/modals/create-transaction-dialog";

interface AppHeaderProps {
  categories: CategoryDTO[];
  budgetResources: BudgetResourceDTO[];
}

export function AppHeader({ categories, budgetResources }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    if (pathname !== "/lancamentos" && pathname !== "/planejamento") {
      router.push("/lancamentos");
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#E8E8E8] bg-white">
      <div className="flex min-h-[70px] flex-wrap items-center justify-between gap-4 px-6 py-2.5 lg:px-8">
        {/* Busca estilo DashStack + Navegação Mobile */}
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
            className="relative hidden w-full max-w-[380px] sm:block"
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
        </div>

        {/* Ações Globais (Modais shadcn/ui) + Notificações + Perfil */}
        <div className="flex flex-wrap items-center gap-3">
          <CreateBudgetResourceDialog
            categories={categories}
            triggerLabel="+ Planejar Recurso"
          />
          <CreateTransactionDialog
            categories={categories}
            budgetResources={budgetResources}
            triggerLabel="+ Lançar Transação"
          />

          {/* Ícone de Notificação com Badge estilo DashStack */}
          <div className="relative ml-1 hidden sm:flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#F5F6FA]">
            <Bell className="h-5 w-5 text-[#4880FF]" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F93C65] px-1 text-[10px] font-bold text-white">
              6
            </span>
          </div>

          {/* Perfil Equipe estilo DashStack */}
          <div className="hidden items-center gap-3 border-l border-[#E8E8E8] pl-4 md:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4880FF]/15 text-sm font-bold text-[#4880FF]">
              GR
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-[#202224]">
                Genesis Racing
              </div>
              <div className="text-xs font-medium text-[#565656]">
                Gestão & Auditoria
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-[#565656]" />
          </div>
        </div>
      </div>

      {/* Barra de navegação rápida no Mobile (quando a Sidebar está oculta) */}
      <div className="flex items-center gap-2 border-t border-[#E8E8E8] px-4 py-2 lg:hidden">
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
      </div>
    </header>
  );
}
