import type {
  AcquisitionStrategy,
  AuthEventType,
  DeliveryGroup,
  TrackingMethod,
  TransactionType,
  UserRole,
} from "@prisma/client";

export const DELIVERY_GROUP_LABELS: Record<DeliveryGroup, string> = {
  ENGINEERING_CAD: "Engenharia & CAD",
  MANUFACTURING_CNC: "Manufatura & CNC",
  PIT_DISPLAY: "Pit Display & Estande",
  MARKETING_SPONSOR: "Marketing & Patrocínio",
  PROJECT_MANAGEMENT: "Gestão do Projeto",
  SOCIAL_PROJECT: "Projeto Social",
};

export const DELIVERY_GROUP_SHORT_LABELS: Record<DeliveryGroup, string> = {
  ENGINEERING_CAD: "Engenharia",
  MANUFACTURING_CNC: "Manufatura",
  PIT_DISPLAY: "Pit Display",
  MARKETING_SPONSOR: "Marketing",
  PROJECT_MANAGEMENT: "Gestão",
  SOCIAL_PROJECT: "Projeto Social",
};

export const ACQUISITION_STRATEGY_LABELS: Record<AcquisitionStrategy, string> = {
  DIRECT_PURCHASE: "Compra Direta",
  FINANCIAL_SPONSOR: "Patrocínio Financeiro",
  BARTER_PARTNERSHIP: "Permuta / Parceria Técnica",
  OWN_FUNDS_RAFFLE: "Recursos Próprios / Rifa",
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  ORIGIN: "Origem (Receita / Aporte)",
  APPLICATION: "Aplicação (Despesa / Saída)",
};

export const TRACKING_METHOD_LABELS: Record<TrackingMethod, string> = {
  NFE: "NF-e (Nota Fiscal)",
  RECEIPT: "Recibo Simples",
  SPONSOR_CONTRACT: "Contrato de Patrocínio",
  BANK_PIX_STATEMENT: "PIX / Extrato Bancário",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "SuperAdmin (Global)",
  FINANCE_MANAGER: "Gestor Financeiro",
  TEAM_LEAD: "Líder / Integrante de Setor",
  AUDITOR: "Auditor (Somente Leitura)",
};

export const AUTH_EVENT_LABELS: Record<AuthEventType, string> = {
  LOGIN_SUCCESS: "Login Autorizado",
  LOGIN_FAILED: "Senha Incorreta / Falha",
  ACCOUNT_LOCKED: "Conta Bloqueada (Anti-Invasão)",
  LOGOUT: "Logout Seguro",
  SESSION_REVOKED: "Sessão Revogada",
  USER_CREATED: "Integrante Cadastrado",
  USER_ROLE_UPDATED: "Permissão / Equipe Atualizada",
  TEAM_CREATED: "Nova Equipe Criada",
};

export const PROJECT_MONTHS = [1, 2, 3, 4, 5, 6] as const;
export type ProjectMonth = (typeof PROJECT_MONTHS)[number];

export const PROJECT_MONTH_LABELS: Record<number, string> = {
  1: "Mês 1",
  2: "Mês 2",
  3: "Mês 3",
  4: "Mês 4",
  5: "Mês 5",
  6: "Mês 6",
};
