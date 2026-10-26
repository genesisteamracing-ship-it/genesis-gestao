import type {
  AcquisitionStrategy,
  DeliveryGroup,
  TrackingMethod,
  TransactionType,
} from "@prisma/client";
import type { AuthenticatedUserDTO } from "./auth";

export interface CategoryDTO {
  id: string;
  name: string;
  deliveryGroup: DeliveryGroup;
}

export interface BudgetResourceDTO {
  id: string;
  code: string;
  deliveryGroup: DeliveryGroup;
  categoryId: string;
  categoryName: string;
  resourceName: string;
  acquisitionStrategy: AcquisitionStrategy;
  allocatedTo: string;
  plannedMonth: number;
  utilizationForecast: number;
  plannedAmountCents: number;
  realizedAmountCents: number;
  transactionsCount: number;
  createdAt: string;
}

export interface TransactionDTO {
  id: string;
  date: string;
  referenceMonth: number;
  type: TransactionType;
  deliveryGroup: DeliveryGroup;
  categoryId: string;
  categoryName: string;
  budgetResourceId: string | null;
  budgetResourceCode: string | null;
  budgetResourceName: string | null;
  acquisitionStrategy: AcquisitionStrategy | null;
  description: string;
  trackingMethod: TrackingMethod;
  documentRef: string | null;
  amountCents: number;
  createdAt: string;
}

export interface CashFlowMonthPoint {
  month: number;
  monthLabel: string;
  originsCents: number;
  applicationsCents: number;
  netBalanceCents: number;
  accumulatedBalanceCents: number;
}

export interface CashFlowSummaryDTO {
  months: CashFlowMonthPoint[];
  totalOriginsCents: number;
  totalApplicationsCents: number;
  totalNetBalanceCents: number;
  finalAccumulatedBalanceCents: number;
}

export type ScheduleAlertStatus = "OK" | "WARNING" | "DESTRUCTIVE";

export interface DeliveryGroupMonthCell {
  month: number;
  plannedCents: number;
  realizedCents: number;
}

export interface DeliveryGroupScheduleRow {
  deliveryGroup: DeliveryGroup;
  label: string;
  months: DeliveryGroupMonthCell[];
  totalPlannedCents: number;
  totalRealizedCents: number;
  varianceCents: number; // Previsto - Realizado
  executionPercentage: number; // 0 to 100+
  status: ScheduleAlertStatus;
  statusLabel: string;
}

export interface DashboardKPIsDTO {
  totalPlannedBudgetCents: number;
  totalOriginsCents: number;
  totalApplicationsCents: number;
  currentCashBalanceCents: number;
  totalResourcesCount: number;
  totalTransactionsCount: number;
}

export interface DashboardMetricsDTO {
  currentUser: AuthenticatedUserDTO;
  kpis: DashboardKPIsDTO;
  cashFlow: CashFlowSummaryDTO;
  schedule: DeliveryGroupScheduleRow[];
  categories: CategoryDTO[];
  budgetResources: BudgetResourceDTO[];
  transactions: TransactionDTO[];
}
