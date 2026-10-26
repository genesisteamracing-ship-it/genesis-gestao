import * as React from "react";
import type { AuthenticatedUserDTO } from "@/types/auth";
import type { BudgetResourceDTO, CategoryDTO } from "@/types/financial";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

interface DashboardShellProps {
  currentUser: AuthenticatedUserDTO;
  categories: CategoryDTO[];
  budgetResources: BudgetResourceDTO[];
  title: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardShell({
  currentUser,
  categories,
  budgetResources,
  title,
  subtitle,
  headerAction,
  children,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-[#F5F6FA] text-[#202224]">
      <AppSidebar currentUser={currentUser} />

      <div className="flex flex-1 flex-col min-w-0">
        <AppHeader
          currentUser={currentUser}
          categories={categories}
          budgetResources={budgetResources}
        />

        <main className="flex-1 p-6 lg:p-8 space-y-7 max-w-[1600px] w-full mx-auto">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight text-[#202224]">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-0.5 text-sm text-[#606060]">{subtitle}</p>
              )}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
