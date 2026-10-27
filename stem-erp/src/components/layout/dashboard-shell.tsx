import * as React from "react";
import type { AuthenticatedUserDTO } from "@/types/auth";
import type {
  ActiveTeamSummaryDTO,
  BudgetResourceDTO,
  CategoryDTO,
  SeasonMonthDTO,
} from "@/types/financial";
import { SeasonProvider } from "@/providers/season-provider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

interface DashboardShellProps {
  currentUser: AuthenticatedUserDTO;
  activeTeam?: ActiveTeamSummaryDTO;
  availableTeams?: ActiveTeamSummaryDTO[];
  categories: CategoryDTO[];
  budgetResources: BudgetResourceDTO[];
  seasonMonths?: SeasonMonthDTO[];
  title: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardShell({
  currentUser,
  activeTeam,
  availableTeams,
  categories,
  budgetResources,
  seasonMonths,
  title,
  subtitle,
  headerAction,
  children,
}: DashboardShellProps) {
  return (
    <SeasonProvider seasonMonths={seasonMonths}>
      <div className="flex min-h-screen bg-background text-foreground transition-colors">
        <AppSidebar currentUser={currentUser} />

        <div className="flex flex-1 flex-col min-w-0">
          <AppHeader
            currentUser={currentUser}
            activeTeam={activeTeam}
            availableTeams={availableTeams}
            categories={categories}
            budgetResources={budgetResources}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-7 max-w-[1600px] w-full mx-auto page-fluid-enter min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold tracking-tight text-foreground truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none">
                    {subtitle}
                  </p>
                )}
              </div>
              {headerAction && (
                <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                  {headerAction}
                </div>
              )}
            </div>

            {children}
          </main>
        </div>
      </div>
    </SeasonProvider>
  );
}
