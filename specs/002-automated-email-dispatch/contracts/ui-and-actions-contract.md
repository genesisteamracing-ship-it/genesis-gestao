# Phase 1 Contracts: Server Actions & Componentes de UI

**Feature Branch**: `002-automated-email-dispatch`
**Created**: 2026-11-04
**Status**: Complete

---

## 1. Server Actions Contracts

### 1.1 `sendStakeholderReportEmailAction` (`stem-erp/src/actions/communication-actions.ts`)

- **Permissão**: Requer usuário autenticado (`requireAuthUser()`). Bloqueia perfil `UserRole.AUDITOR`.
- **Entrada (`SendStakeholderReportEmailInput`)**:
  - `stakeholderId: string`
  - `reportType: "FINANCIAL" | "ROI" | "COMBINED"`
  - `periodLabel: string`
  - `customNote?: string`
  - `subject: string`
  - `emailText: string`
  - `emailHtml: string`
- **Processamento**:
  1. Valida payload com `sendStakeholderReportEmailSchema`.
  2. Resolve equipe ativa (`resolveActiveTeam(user)`), obtendo `activeTeam.senderEmail` (fallback `"genesisteamracing@gmail.com"`).
  3. Busca o stakeholder no banco garantindo que pertença a `activeTeam.id` e que possua `email` cadastrado e válido.
  4. Invoca `sendAutomatedEmail` (`src/services/email-service.ts`) passando `{ fromEmail: activeTeam.senderEmail, fromName: activeTeam.name, toEmail: stakeholder.email, toName: stakeholder.name, subject, text: emailText, html: emailHtml }`.
  5. Cria registro automático em `CommunicationLog` (`channel: "EMAIL"`, `subject`, `contentSummary`, `reportTypeIncluded: reportType`).
  6. Executa `revalidatePath("/comunicacao")`.
- **Saída (`ActionResponse<{ logId: string; recipientEmail: string; senderEmail: string; simulated: boolean }>`)**:
  - `success: true`, `message: "E-mail enviado com sucesso para <email> (Remetente: <senderEmail>)!"`

---

### 1.2 `updateTeamSenderEmailAction` (`stem-erp/src/actions/auth-actions.ts`)

- **Permissão**: Requer usuário autenticado (`requireAuthUser()`). Bloqueia perfil `UserRole.AUDITOR`.
- **Entrada (`UpdateTeamSenderEmailInput`)**:
  - `teamId: string`
  - `senderEmail: string`
- **Processamento**:
  1. Valida payload com `updateTeamSenderEmailSchema`.
  2. Atualiza `prisma.team.update({ where: { id: teamId }, data: { senderEmail } })`.
  3. Registra evento de auditoria em `SecurityAuditLog` (`action: "TEAM_SENDER_EMAIL_UPDATED"`).
  4. Executa `revalidatePath("/equipe")` e `revalidatePath("/comunicacao")`.
- **Saída (`ActionResponse<{ senderEmail: string }>`)**:
  - `success: true`, `message: "E-mail de envio atualizado para <senderEmail> com sucesso!"`

---

## 2. Contratos de Componentes de UI

### 2.1 `CommunicationScheduleTab` (`stem-erp/src/components/communication/communication-schedule-tab.tsx`)
- **Props**:
  - `stakeholders: StakeholderWithRelations[]`
  - `senderEmail: string`
  - `onSelectStakeholderForReport?: (stakeholderId: string) => void`
- **Comportamento & Regras Visuais**:
  - Exibe cabeçalho com mês/ano atual, botões de navegação (`Mês Anterior`, `Hoje`, `Próximo Mês`) e badge informando o e-mail remetente ativo (`senderEmail`).
  - Renderiza grade de calendário mensal (Dom a Sáb).
  - Nos dias com relatórios agendados (`day.hasScheduledReports === true`):
    - O número do dia recebe um **círculo azul transparente ao redor do número** (`inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/60 bg-primary/15 font-bold text-primary`), conforme especificação `(1)`.
    - Ao passar o mouse (*hover*) ou focar no dia, exibe **pop-up** (`role="tooltip"`) com:
      - Cabeçalho da data formatada (`dd/MM/yyyy`) e quantidade de relatórios agendados.
      - Para cada agendamento do dia: Nome do stakeholder, Organização/Grupo, descrição **"Relatório Executivo Completo (Envio Automático)"**, periodicidade configurada (ex: `Semanal`, `Quinzenal`, `Mensal`) e data base do cadastro.
  - Estado vazio (*Empty State*): Caso não haja stakeholders cadastrados, exibe orientação clara para cadastrar stakeholders no Mapa Hierárquico.

### 2.2 `ReportGeneratorTab` (`stem-erp/src/components/communication/report-generator-tab.tsx`)
- **Mudança Principal**:
  - Substitui o botão `"Registrar Envio no Histórico"` pelo botão primário **"Enviar E-mail"** (`Send` / `Mail` icon).
  - Ao clicar em **"Enviar E-mail"**, dispara diretamente `sendStakeholderReportEmailAction` com estado de loading (`Enviando E-mail...`) e exibe feedback claro de sucesso ou erro (ex: se o stakeholder selecionado não tiver e-mail cadastrado).

### 2.3 `TeamSenderEmailCard` (`stem-erp/src/components/forms/team-sender-email-card.tsx`)
- **Localização**: Renderizado em `stem-erp/src/app/equipe/page.tsx` (tela **Equipe & Acessos**).
- **Props**:
  - `teamId: string`
  - `teamName: string`
  - `initialSenderEmail: string` (default `"genesisteamracing@gmail.com"`)
- **Comportamento**:
  - Exibe um card com `Input` editável para o **E-mail de Envio de Relatórios** da equipe e botão **"Salvar E-mail de Envio"**.
  - Valida formato de e-mail e persiste via `updateTeamSenderEmailAction`.

### 2.4 Navegação Lateral (`AppSidebar` e `MobileNavDrawer`)
- No grupo **Comunicação**:
  - Substitui `{ title: "Histórico", href: "/comunicacao?tab=historico", tab: "historico", icon: History }` por `{ title: "Agendamentos", href: "/comunicacao?tab=agendamentos", tab: "agendamentos", icon: CalendarClock }`.
  - Mantém compatibilidade no `CommunicationView` caso alguém acesse `?tab=agendamentos` (ou redireciona `?tab=historico` para o calendário de agendamentos).
