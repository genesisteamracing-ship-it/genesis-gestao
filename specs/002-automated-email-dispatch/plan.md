# Implementation Plan: Envio Automatizado de Relatórios por E-mail & Calendário de Agendamentos

**Branch**: `002-automated-email-dispatch` | **Date**: 2026-11-04 | **Spec**: [spec.md](file:///c:/Users/N01/OneDrive/Documentos/agenesis-gesta/specs/002-automated-email-dispatch/spec.md)
**Input**: Feature specification from `/specs/002-automated-email-dispatch/spec.md`

## Summary

Automatizar o envio de relatórios executivos por e-mail com 1 clique no Gerador de Relatórios utilizando `nodemailer` (com e-mail remetente padrão `genesisteamracing@gmail.com` configurável na tela **Equipe & Acessos** `/equipe`) e substituir a seção "Histórico" do módulo de Comunicação por **"Agendamentos"**, apresentando um calendário mensal interativo que calcula e projeta automaticamente as datas dos próximos envios de **Relatório Executivo Completo** a partir da data de cadastro (`createdAt`) e da periodicidade (`preferredFrequency`) de cada stakeholder, destacando os dias agendados com um círculo azul transparente ao redor do número do dia `(1)` e exibindo um pop-up descritivo ao passar o mouse (*hover*).

## Technical Context

**Language/Version**: TypeScript 5.x (Strict Mode, zero `any`), Node.js 20+, React 19.2, Next.js 16.1.6 (App Router)
**Primary Dependencies**: `@prisma/client` ^6.19.2, `nodemailer` ^6.10.0, `zod` ^4.3.6, `react-hook-form` ^7.71.2, `tailwind-variants` ^3.2.2, `lucide-react` ^0.577.0, Radix UI / `shadcn/ui`
**Storage**: PostgreSQL via Prisma ORM (`stem-erp/prisma/schema.prisma`) — adição de `senderEmail String @default("genesisteamracing@gmail.com")` na tabela `Team`
**Testing**: Node test runner via `tsx --test` (`npm test` em `stem-erp/`) + Playwright (`@playwright/test`) para fluxos E2E
**Target Platform**: Web Application Responsiva (Mobile-First `320px+` até Desktop `1600px`) dentro do `<DashboardShell>`
**Project Type**: Fullstack Next.js Web Application (App Router + Server Actions)
**Performance Goals**: Cálculo mensal do calendário de agendamentos em `O(N)` no cliente (`< 5ms` para 100 stakeholders); feedback imediato de loading/sucesso no disparo de e-mail
**Constraints**: Zero cores hexadecimais/arbitrárias (uso estrito de tokens semânticos como `bg-primary/15`, `border-primary/60`, `text-primary`), `tailwind-variants` (`tv`) fora do corpo dos componentes, limite de 150 linhas por componente visual (SRP)
**Scale/Scope**: Equipes STEM Racing (dezenas de stakeholders por equipe, projeção mensal/anual de calendário e envio transacional de relatórios executivos)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Verification Notes |
|-----------|--------|--------------------|
| **I. Design System & Semantic Tokens (Zero Hardcoding)** | PASS | O círculo azul transparente ao redor do dia agendado usa exclusivamente `bg-primary/15 border-primary/60 text-primary` e o pop-up usa `bg-popover text-popover-foreground border-border`. |
| **II. Shadcn UI First & `tailwind-variants` (`tv`)** | PASS | Todos os estilos do calendário, círculos de dias, pop-up e card de configuração de e-mail utilizam `tv()` com `slots` e `variants` declarados fora dos componentes. |
| **III. SOLID Architecture & Component Discipline** | PASS | Motor de cálculo de datas isolado em `src/lib/communication-schedule.ts`; serviço SMTP isolado em `src/services/email-service.ts`; componentes visuais enxutos (`< 150` linhas). |
| **IV. Complete UI States, Accessibility (a11y) & UX** | PASS | Botão de envio de e-mail e input de `senderEmail` tratam estados de Loading, Error e Success; dias agendados possuem `aria-label` descritivo e suporte a hover + foco por teclado. |
| **V. Standardized Layout Shell & Mobile-First** | PASS | Tanto `/comunicacao` quanto `/equipe` permanecem dentro do `<DashboardShell>`, e os menus `AppSidebar` e `MobileNavDrawer` são atualizados em conjunto de "Histórico" para "Agendamentos". |
| **VI. Comprehensive Automated Testing** | PASS | Testes unitários planejados para `communication-schedule.test.ts`, schemas Zod (`communication-email-validation.test.ts`) e serviço de disparo (`email-service.test.ts`). |

## Project Structure

### Documentation (this feature)

```text
specs/002-automated-email-dispatch/
├── plan.md              # Este arquivo (/speckit-plan)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── ui-and-actions-contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
stem-erp/
├── prisma/
│   └── schema.prisma                                         # + senderEmail String @default("genesisteamracing@gmail.com") no model Team
├── src/
│   ├── actions/
│   │   ├── auth-actions.ts                                   # + updateTeamSenderEmailAction + senderEmail em getTeamManagementMetricsAction
│   │   └── communication-actions.ts                          # + sendStakeholderReportEmailAction
│   ├── app/
│   │   ├── comunicacao/
│   │   │   └── page.tsx                                      # Passa senderEmail e dados para CommunicationView
│   │   └── equipe/
│   │       └── page.tsx                                      # Renderiza TeamSenderEmailCard para configurar o e-mail de envio
│   ├── components/
│   │   ├── communication/
│   │   │   ├── communication-view.tsx                        # Troca aba "historico" por "agendamentos" (CommunicationScheduleTab)
│   │   │   ├── communication-schedule-tab.tsx                # NOVO: Calendário de agendamentos com círculo azul transparente e pop-up no hover
│   │   │   └── report-generator-tab.tsx                      # Substitui "Registrar Envio no Histórico" por botão "Enviar E-mail"
│   │   ├── forms/
│   │   │   └── team-sender-email-card.tsx                    # NOVO: Card com input para alterar o e-mail de envio em Equipe & Acessos
│   │   └── layout/
│   │       ├── app-sidebar.tsx                               # Troca item "Histórico" por "Agendamentos" (/comunicacao?tab=agendamentos)
│   │       └── mobile-nav-drawer.tsx                         # Troca item "Histórico" por "Agendamentos" (/comunicacao?tab=agendamentos)
│   ├── lib/
│   │   ├── communication-schedule.ts                         # NOVO: Motor puro de projeção de datas no calendário por periodicidade
│   │   ├── __tests__/
│   │   │   └── communication-schedule.test.ts                # NOVO: Testes unitários do cálculo de agendamentos (semanal, quinzenal, mensal, etc.)
│   │   └── validations/
│   │       ├── communication.ts                              # + sendStakeholderReportEmailSchema e updateTeamSenderEmailSchema
│   │       └── __tests__/
│   │           └── communication-validation.test.ts          # + Testes dos novos schemas Zod
│   ├── services/
│   │   ├── email-service.ts                                  # NOVO: Serviço Nodemailer com suporte a Gmail SMTP e fallback seguro
│   │   └── financial-service.ts                              # Inclui senderEmail no DTO de activeTeam
│   └── types/
│       └── financial.ts                                      # + senderEmail?: string em TeamSummaryDTO
```

**Structure Decision**: Mantém a arquitetura modular do Next.js App Router em `stem-erp/src/`, separando rigorosamente utilitários puros (`src/lib/communication-schedule.ts`), serviços de infraestrutura (`src/services/email-service.ts`), Server Actions (`src/actions/`) e componentes visuais enxutos estilizados com `tailwind-variants` (`src/components/`).

## Complexity Tracking

> Nenhuma violação à Constituição do Projeto. Todas as decisões respeitam o limite de linhas, tokens semânticos e separação de responsabilidades.
