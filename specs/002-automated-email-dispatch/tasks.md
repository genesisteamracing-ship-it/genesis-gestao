---
description: "Task list for feature 002-automated-email-dispatch implementation"
---

# Tasks: Disparo Automatizado de E-mail, Calendário de Agendamentos e Configuração de Remetente

**Input**: Design documents from `/specs/002-automated-email-dispatch/`
**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `research.md`, `data-model.md`, `contracts/ui-and-actions-contract.md`, `quickstart.md`

**Tests**: Incluídos conforme Constituição do Projeto (Princípio VI - Estratégia de Testes Automatizados com `tsx --test`).

**Organization**: Tarefas agrupadas por User Story (`US1`, `US2`, `US3`) para permitir implementação e validação independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode ser executada em paralelo (arquivos distintos, sem dependência de tarefa incompleta)
- **[Story]**: User Story correspondente (`[US1]`, `[US2]`, `[US3]`)
- Caminhos exatos de arquivos incluídos em todas as tarefas

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Instalação da biblioteca de disparo de e-mail (`nodemailer`) e atualização do schema Prisma para suportar o e-mail remetente da equipe (`senderEmail`).

- [X] T001 Install `nodemailer` and `@types/nodemailer` dependencies in `stem-erp/package.json`
- [X] T002 Add `senderEmail String @default("genesisteamracing@gmail.com")` field to `Team` model in `stem-erp/prisma/schema.prisma` and sync Prisma client

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schemas de validação Zod, tipos de domínio, serviço de envio de e-mail via `nodemailer` e exposição do `senderEmail` no contexto de equipe ativa.

**⚠️ CRITICAL**: Nenhuma User Story deve ser iniciada antes da conclusão desta fase.

- [X] T003 [P] Add `senderEmail?: string` to `TeamSummaryDTO` in `stem-erp/src/types/financial.ts` and include `senderEmail` in `resolveActiveTeam` in `stem-erp/src/services/financial-service.ts`
- [X] T004 [P] Add `ScheduledReportItemDTO`, `CalendarDayScheduleDTO`, and `MonthlyScheduleCalendarDTO` types in `stem-erp/src/types/communication.ts`
- [X] T005 [P] Add `sendStakeholderReportEmailSchema` (`stakeholderId` min 1, `reportType` enum `["FINANCIAL", "ROI", "COMBINED"]`, `periodLabel` 2..80 chars, `customNote` max 500 chars, `subject` 3..180 chars, `emailText` min 10 chars, `emailHtml` min 10 chars) and `updateTeamSenderEmailSchema` (`teamId` min 1, `senderEmail` valid email format) in `stem-erp/src/lib/validations/communication.ts`
- [X] T006 [P] Create `nodemailer` email dispatch service (`sendAutomatedEmail` with `genesisteamracing@gmail.com` default sender, Gmail SMTP transport, and safe dev/test simulation fallback) in `stem-erp/src/services/email-service.ts`
- [X] T007 [P] Add unit tests for `sendStakeholderReportEmailSchema` and `updateTeamSenderEmailSchema` in `stem-erp/src/lib/validations/__tests__/communication-validation.test.ts`

**Checkpoint**: Fundação pronta — `senderEmail`, schemas Zod e `email-service.ts` disponíveis para todas as User Stories.

---

## Phase 3: User Story 1 - Calendário de Agendamentos Automáticos por Periodicidade (Priority: P1) 🎯 MVP

**Goal**: Substituir "Histórico" por **"Agendamentos"** na navegação e na tela de Comunicação, exibindo um calendário mensal que projeta automaticamente os próximos envios de **Relatório Executivo Completo** de acordo com a data de cadastro (`createdAt`) e periodicidade (`preferredFrequency`) de cada stakeholder, destacando os dias agendados com um **círculo azul transparente ao redor do número do dia** `(1)` e exibindo um **pop-up** descritivo ao passar o mouse (*hover*).

**Independent Test**: Cadastrar um stakeholder (ex: dia 04 com periodicidade `Semanal`), acessar `Comunicação > Agendamentos` (`/comunicacao?tab=agendamentos`), verificar o círculo azul transparente nos dias `11`, `18`, `25` e passar o mouse sobre o dia para visualizar o pop-up com a descrição do envio automático do Relatório Executivo Completo.

### Tests for User Story 1

- [X] T008 [P] [US1] Write unit tests for schedule projection (`WEEKLY` +7d, `BIWEEKLY` +14d, `MONTHLY` +1m with month-end clamping, `BIMONTHLY` +2m, `QUARTERLY` +3m, `SEMIANNUALLY` +6m) and monthly calendar grid generation in `stem-erp/src/lib/__tests__/communication-schedule.test.ts`

### Implementation for User Story 1

- [X] T009 [US1] Implement pure calendar projection engine (`projectStakeholderSchedulesInMonth`, `getNextStakeholderScheduleDate`, and `buildMonthlyScheduleCalendar`) in `stem-erp/src/lib/communication-schedule.ts`
- [X] T010 [P] [US1] Create `CommunicationScheduleTab` component with `tailwind-variants` (`tv`), month navigation, transparent blue circle around scheduled day numbers (`rounded-full bg-primary/15 border border-primary/60 text-primary font-bold`), and hover/focus descriptive pop-up in `stem-erp/src/components/communication/communication-schedule-tab.tsx`
- [X] T011 [P] [US1] Replace "Histórico" (`?tab=historico`) with "Agendamentos" (`?tab=agendamentos`) in desktop sidebar `stem-erp/src/components/layout/app-sidebar.tsx` and mobile drawer `stem-erp/src/components/layout/mobile-nav-drawer.tsx`
- [X] T012 [US1] Update `CommunicationView` in `stem-erp/src/components/communication/communication-view.tsx` to render `CommunicationScheduleTab` on the `agendamentos` tab (with fallback support for `historico`)

**Checkpoint**: User Story 1 funcional e testável de forma independente.

---

## Phase 4: User Story 2 - Envio Imediato de Relatório por E-mail com Um Clique (Priority: P1)

**Goal**: Permitir enviar o relatório gerado por e-mail em apenas 1 clique através do botão **"Enviar E-mail"** no Gerador de Relatórios (removendo o antigo botão "Registrar Envio no Histórico"), utilizando o remetente da equipe (`genesisteamracing@gmail.com` por padrão) e registrando o disparo automaticamente.

**Independent Test**: Gerar a prévia de um relatório em `/comunicacao?tab=relatorios` para um stakeholder com e-mail válido, clicar no botão **"Enviar E-mail"** e verificar o disparo imediato e a mensagem de confirmação com o remetente da equipe.

### Implementation for User Story 2

- [X] T013 [US2] Implement `sendStakeholderReportEmailAction` Server Action (validating input, checking RBAC `AUDITOR` restriction, resolving `activeTeam.senderEmail`, invoking `sendAutomatedEmail`, and recording `CommunicationLog`) in `stem-erp/src/actions/communication-actions.ts`
- [X] T014 [US2] Refactor `ReportGeneratorTab` in `stem-erp/src/components/communication/report-generator-tab.tsx` to replace the "Registrar Envio no Histórico" button with the 1-click **"Enviar E-mail"** button wired to `sendStakeholderReportEmailAction` with loading, error, and success feedback

**Checkpoint**: User Stories 1 e 2 funcionais e integradas.

---

## Phase 5: User Story 3 - Configuração do E-mail de Envio em Equipe & Acessos (Priority: P2)

**Goal**: Disponibilizar na tela **Equipe & Acessos** (`/equipe`) um campo de entrada (`Input`) para visualizar e alterar o e-mail de envio da equipe (inicializado com `genesisteamracing@gmail.com`).

**Independent Test**: Acessar `/equipe`, verificar o input preenchido com `genesisteamracing@gmail.com`, alterar para um novo e-mail válido, salvar e confirmar que a alteração persiste após recarregar a página.

### Implementation for User Story 3

- [X] T015 [US3] Implement `updateTeamSenderEmailAction` Server Action and include `senderEmail` in `getTeamManagementMetricsAction` in `stem-erp/src/actions/auth-actions.ts`
- [X] T016 [P] [US3] Create `TeamSenderEmailCard` component with `tailwind-variants` (`tv`), email input, validation feedback, and save button in `stem-erp/src/components/forms/team-sender-email-card.tsx`
- [X] T017 [US3] Render `TeamSenderEmailCard` in `Equipe & Acessos` page `stem-erp/src/app/equipe/page.tsx`

**Checkpoint**: Todas as User Stories (`US1`, `US2`, `US3`) completas e testáveis independentemente.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final de qualidade, testes automatizados (`npm test`), lint e build de produção.

- [X] T018 Run full unit and validation test suite (`npm test`) and ESLint (`npm run lint`) in `stem-erp/` to ensure zero regressions and strict TypeScript compliance
