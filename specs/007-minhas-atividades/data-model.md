# Data Model: Painel de Minhas Atividades e KPIs de Desempenho Individual

**Feature**: `007-minhas-atividades` | **Date**: 2026-11-12

## 1. Alterações no Schema de Banco de Dados (`prisma/schema.prisma`)

### 1.1 Enum `TaskStatus`

Adição do estado `CANCELLED` ao enum existente:

```prisma
enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
  CANCELLED
}
```

### 1.2 Model `Task`

Adição de campos opcionais de rastreamento temporal de encerramento:

| Campo | Tipo | Nullable | Default | Descrição |
|---|---|---|---|---|
| `completedAt` | `DateTime` | Sim | `null` | Data/hora em que a tarefa foi marcada como `DONE`. Limpa (`null`) se reaberta para `TODO`, `IN_PROGRESS` ou `CANCELLED`. |
| `cancelledAt` | `DateTime` | Sim | `null` | Data/hora em que a tarefa foi marcada como `CANCELLED`. Limpa (`null`) se reaberta para outro estado. |

## 2. Regras de Transição de Estado

| Estado Anterior | Novo Estado | Efeito em `completedAt` | Efeito em `cancelledAt` | Efeito em `revision` |
|---|---|---|---|---|
| Qualquer | `DONE` | Define `new Date()` | Define `null` | `increment: 1` |
| Qualquer | `CANCELLED` | Define `null` | Define `new Date()` | `increment: 1` |
| `DONE` / `CANCELLED` | `TODO` / `IN_PROGRESS` | Define `null` | Define `null` | `increment: 1` |
| `TODO` ↔ `IN_PROGRESS` | `TODO` / `IN_PROGRESS` | Mantém `null` | Mantém `null` | `increment: 1` |

## 3. Tipos de Domínio e DTOs (`src/types/tasks.ts`)

### 3.1 `TaskRecord` (Extensão)

```ts
export type TaskRecord = {
  id: string;
  title: string;
  description: string | null;
  deliveryGroup: DeliveryGroup;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: TaskStatus;
  completedAt: string | null; // ISO-8601
  cancelledAt: string | null; // ISO-8601
  revision: number;
  roles: { person: TaskPerson; role: TaskRole }[];
};
```

### 3.2 `TaskWorkspace` (Extensão)

Inclui `currentUserId: string` para identificação inequívoca das atividades atribuídas ao usuário autenticado no cliente e nos hooks:

```ts
export type TaskWorkspace = {
  teamId: string;
  currentUserId: string;
  canEdit: boolean;
  members: TaskPerson[];
  tasks: TaskRecord[];
  edges: TaskEdge[];
  paths: TaskRisk[];
};
```

### 3.3 Tipos Derivados de Prazos e KPIs (`src/lib/my-activities.ts`)

```ts
export type DeadlineUrgency =
  | "OVERDUE"
  | "DUE_TODAY"
  | "DUE_SOON"
  | "ON_TRACK"
  | "COMPLETED"
  | "CANCELLED";

export type DeadlineFilter = "ALL" | "OVERDUE" | "THIS_WEEK" | "NEXT_15_DAYS";
export type StatusFilter = "ALL" | TaskStatus;

export type MyActivityItem = {
  task: TaskRecord;
  urgency: DeadlineUrgency;
  daysRemaining: number; // negativo se atrasada, 0 se hoje, positivo se futuro
  deadlineLabel: string; // ex: "Atrasada há 2 dias", "Vence hoje", "Vence em 3 dias"
  isOverdue: boolean;
  isOnTimeCompletion: boolean | null; // boolean para DONE, null para demais
};

export type UserActivityKpis = {
  totalAssigned: number;
  completedCount: number;
  pendingCount: number;
  overdueCount: number;
  cancelledCount: number;
  onTimeCompletedCount: number;
  completionRate: number;      // 0..100 inteiro
  punctualityRate: number | null; // 0..100 inteiro ou null se completedCount === 0
};
```

## 4. Regras de Validação (Zod - `src/lib/validations/tasks.ts`)

- **`updateMyTaskStatusSchema`**:
  - `teamId`: string não vazia (`cuid` / id válido)
  - `taskId`: string não vazia
  - `status`: `z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"])`
  - `revision`: `z.number().int().min(0)` (garante controle de concorrência otimista)
- **`taskSchema` (existente)**:
  - Atualizar enum de `status` aceito para incluir `"CANCELLED"`.
