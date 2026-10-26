import { Flag } from "lucide-react";
import type { BudgetResourceDTO, CategoryDTO } from "@/types/financial";
import { NavLinks } from "@/components/layout/nav-links";
import { CreateBudgetResourceDialog } from "@/components/modals/create-budget-resource-dialog";
import { CreateTransactionDialog } from "@/components/modals/create-transaction-dialog";

interface AppHeaderProps {
  categories: CategoryDTO[];
  budgetResources: BudgetResourceDTO[];
}

export function AppHeader({ categories, budgetResources }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
              <Flag className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  STEM Racing ERP
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                  Auditoria & Finanças
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Gestão Orçamentária, Alocação de Recursos e Cronograma Físico-Financeiro
              </p>
            </div>
          </div>

          <NavLinks />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <CreateBudgetResourceDialog categories={categories} />
          <CreateTransactionDialog
            categories={categories}
            budgetResources={budgetResources}
          />
        </div>
      </div>
    </header>
  );
}
