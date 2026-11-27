# Data Model: Sinais de Status, Linha de Base e Caminho Crítico no Gantt

**Feature**: `008-gantt-sinais-cronograma` | **Date**: 2026-11-27

## 1. Alterações Aditivas no Schema Prisma (`stem-erp/prisma/schema.prisma`)

Alteração 100% aditiva e retrocompatível no modelo `Task` (nenhuma coluna removida ou alterada; zero risco de perda de dados):

```prisma
model Task {
  // ... campos existentes preservados integralmente
  startDate         DateTime         @db.Date
  endDate           DateTime         @db.Date
  baselineStartDate DateTime?        @db.Date
  baselineEndDate   DateTime?        @db.Date
  isAtRisk          Boolean          @default(false)
  isCritical        Boolean          @default(false)
  // ... demais campos e relações existentes
}
```

### Regras de Integridade & Fallback
- **Novas tarefas (`createTask`)**:
  - `baselineStartDate` recebe `startDate` automaticamente (ou o valor explícito se fornecido).
  - `baselineEndDate` recebe `endDate` automaticamente (ou o valor explícito se fornecido).
  - `isAtRisk` inicia como `false` (ou valor informado no formulário).
  - `isCritical` inicia como `false` (ou valor informado no formulário).
- **Tarefas legadas (antes desta migração)**:
  - Quando `baselineStartDate` for `null`, a projeção de domínio usa `startDate`.
  - Quando `baselineEndDate` for `null`, a projeção de domínio usa `endDate`.
- **Reprogramação (`rescheduleTask` via drag/resize no Gantt)**:
  - Atualiza apenas `startDate` e `endDate`.
  - Preserva `baselineStartDate` e `baselineEndDate` intactos (se ainda forem `null` em tarefa legada, grava as datas anteriores como baseline antes de aplicar a nova data).
- **Edição completa (`editTask`)**:
  - Permite atualizar `startDate`, `endDate`, `baselineStartDate`, `baselineEndDate`, `isAtRisk` e `isCritical`.
  - Validação obrigatória: `startDate <= endDate` **e** `baselineStartDate <= baselineEndDate`.

## 2. Tipos de Domínio Derivados (`stem-erp/src/types/tasks.ts`)

Extensão de `TaskRecord`:

```ts
export type TaskRecord = {
  id: string;
  title: string;
  description: string | null;
  deliveryGroup: DeliveryGroup;
  startDate: string;
  endDate: string;
  baselineStartDate: string;
  baselineEndDate: string;
  isAtRisk: boolean;
  isCritical: boolean;
  status: TaskStatus;
  completedAt: string | null;
  cancelledAt: string | null;
  revision: number;
  canManage?: boolean;
  roles: { person: TaskPerson; role: TaskRole }[];
};
```

Novos tipos puros de projeção do Gantt (`stem-erp/src/lib/task-gantt-metrics.ts`):

- `TaskScheduleSignal = "ON_TRACK" | "AT_RISK" | "DELAYED" | "COMPLETED" | "CANCELLED"`
- `MilestoneStatus = "ON_TRACK" | "AT_RISK" | "DELAYED" | "COMPLETED" | "EMPTY"`
- `GanttTaskMetrics`:
  - `shortId: string` (`A`, `B`, ..., `Z`, `AA`, `AB`, ...)
  - `signal: TaskScheduleSignal`
  - `signalLabel: string` (`"Em dia"`, `"Atenção"`, `"Atrasada"`, `"Concluída"`, `"Cancelada"`)
  - `isCritical: boolean` (true se CPM folga zero OU `task.isCritical === true`)
  - `deviationDays: number` (diferença entre término efetivo e término da linha de base)
- `GanttSummary`:
  - `progressPercent: number` (`0..100`)
  - `criticalCount: number`
  - `deviationDays: number`
  - `milestoneStatus: MilestoneStatus`
  - `milestoneLabel: string` (`"No prazo"`, `"Sob atenção"`, `"Em atraso"`, `"Concluído"`, `"Sem atividades"`)

## 3. Fluxo de Transição de Estados de Sinal

| Condição (ordem de precedência) | `TaskScheduleSignal` | Rótulo na Barra |
| --- | --- | --- |
| `status === "CANCELLED"` | `CANCELLED` | `Cancelada` |
| `status === "DONE"` | `COMPLETED` | `Concluída` (com ícone ✓) |
| `endDate > baselineEndDate` OU `todayIso > baselineEndDate` | `DELAYED` | `Atrasada` |
| `isAtRisk === true` OU `(baselineEndDay - todayDay) <= 2` OU proporção decorrida `>= 0.8` | `AT_RISK` | `Atenção` |
| Demais casos | `ON_TRACK` | `Em dia` |
