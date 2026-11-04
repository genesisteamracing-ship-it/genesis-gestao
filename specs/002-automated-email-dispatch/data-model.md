# Phase 1 Data Model: Envio Automatizado de Relatórios por E-mail & Calendário de Agendamentos

**Feature Branch**: `002-automated-email-dispatch`
**Created**: 2026-11-04
**Status**: Complete

---

## 1. Alterações no Schema Prisma (`stem-erp/prisma/schema.prisma`)

### Modelo `Team` (Adição de `senderEmail`)

O modelo `Team` recebe a coluna `senderEmail` com valor padrão `"genesisteamracing@gmail.com"`:

```prisma
model Team {
  id                  String                @id @default(cuid())
  name                String
  slug                String                @unique
  category            String                @default("F1 in Schools")
  schoolOrOrg         String?
  senderEmail         String                @default("genesisteamracing@gmail.com")
  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt
  // ... relações existentes preservadas
}
```

### Modelos Existentes Reutilizados (Sem Quebra)
- **`Stakeholder`**:
  - `id: String`
  - `name: String`
  - `organization: String?`
  - `group: StakeholderGroup`
  - `email: String?` (destinatário do disparo automatizado)
  - `preferredFrequency: CommunicationFrequency` (`WEEKLY`, `BIWEEKLY`, `MONTHLY`, `BIMONTHLY`, `QUARTERLY`, `SEMIANNUALLY`)
  - `createdAt: DateTime` (data base de cadastro para cálculo das próximas ocorrências no calendário)
- **`CommunicationLog`**:
  - Cada disparo de e-mail bem-sucedido pelo botão **"Enviar E-mail"** cria automaticamente um registro em `CommunicationLog` com `channel: EMAIL`, `reportTypeIncluded: "COMBINED"` (ou o escopo selecionado), `subject` e `sentAt: new Date()`.

---

## 2. DTOs e Tipos de Domínio (`stem-erp/src/types/communication.ts` e `src/lib/communication-schedule.ts`)

### `ScheduledReportItemDTO`
Representa um envio automático de **Relatório Executivo Completo** projetado para um stakeholder em uma data específica do calendário:

```ts
export interface ScheduledReportItemDTO {
  id: string; // "${stakeholderId}-${dateKey}"
  stakeholderId: string;
  stakeholderName: string;
  organization: string | null;
  group: StakeholderGroup;
  recipientEmail: string | null;
  frequency: CommunicationFrequency;
  frequencyLabel: string;
  registeredAtIso: string; // Data original de cadastro
  scheduledDateKey: string; // "YYYY-MM-DD"
  reportTitle: string; // "Relatório Executivo Completo"
  occurrenceNumber: number; // 1º envio, 2º envio, etc.
}
```

### `CalendarDayScheduleDTO`
Representa uma célula diária na grade mensal do calendário de agendamentos:

```ts
export interface CalendarDayScheduleDTO {
  dateKey: string; // "YYYY-MM-DD"
  dayOfMonth: number; // 1..31
  isCurrentMonth: boolean;
  isToday: boolean;
  scheduledItems: ScheduledReportItemDTO[];
  hasScheduledReports: boolean;
}
```

### `MonthlyScheduleCalendarDTO`
Estrutura retornada pelo motor puro `buildMonthlyScheduleCalendar`:

```ts
export interface MonthlyScheduleCalendarDTO {
  year: number;
  month: number; // 0..11
  monthLabel: string; // ex: "Novembro de 2026"
  days: CalendarDayScheduleDTO[]; // 42 células (6 semanas x 7 dias, Dom..Sáb)
  totalScheduledInMonth: number;
  upcomingItemsInMonth: ScheduledReportItemDTO[];
}
```

---

## 3. Contratos de Validação Zod (`stem-erp/src/lib/validations/communication.ts`)

### `sendStakeholderReportEmailSchema`
Valida o payload da Server Action de envio de e-mail com 1 clique:

```ts
export const sendStakeholderReportEmailSchema = z.object({
  stakeholderId: z.string().min(1, "Selecione um stakeholder destinatário."),
  reportType: z.enum(["FINANCIAL", "ROI", "COMBINED"]).default("COMBINED"),
  periodLabel: z
    .string()
    .trim()
    .min(2, "Informe o período de referência.")
    .max(80, "O período deve ter no máximo 80 caracteres."),
  customNote: z
    .string()
    .trim()
    .max(500, "A nota personalizada deve ter no máximo 500 caracteres.")
    .optional()
    .or(z.literal("")),
  subject: z
    .string()
    .trim()
    .min(3, "O assunto do e-mail deve ter pelo menos 3 caracteres.")
    .max(180, "O assunto deve ter no máximo 180 caracteres."),
  emailText: z.string().min(10, "O corpo do e-mail em texto não pode estar vazio."),
  emailHtml: z.string().min(10, "O corpo do e-mail em HTML não pode estar vazio."),
});

export type SendStakeholderReportEmailInput = z.infer<typeof sendStakeholderReportEmailSchema>;
```

### `updateTeamSenderEmailSchema`
Valida a atualização do e-mail remetente da equipe na tela `Equipe & Acessos` (`/equipe`):

```ts
export const updateTeamSenderEmailSchema = z.object({
  teamId: z.string().min(1, "Identificador da equipe é obrigatório."),
  senderEmail: z
    .string()
    .trim()
    .min(1, "Informe o e-mail de envio da equipe.")
    .email("Informe um endereço de e-mail válido (ex: genesisteamracing@gmail.com)."),
});

export type UpdateTeamSenderEmailInput = z.infer<typeof updateTeamSenderEmailSchema>;
```
