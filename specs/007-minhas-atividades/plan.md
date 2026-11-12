# Implementation Plan: Painel de Minhas Atividades e KPIs de Desempenho Individual

**Branch**: `007-minhas-atividades` | **Date**: 2026-11-12 | **Spec**: [spec.md](file:///c:/Users/N01/OneDrive/Documentos/agenesis-gesta/specs/007-minhas-atividades/spec.md)

**Input**: Feature specification from `/specs/007-minhas-atividades/spec.md`

## Summary

Adicionar a visão **"Minhas atividades"** ao módulo de Tarefas (`/tarefas?tab=my-activities`), listando exclusivamente as atividades atribuídas ao integrante autenticado ordenadas pela proximidade do prazo limite de finalização (atrasadas primeiro, seguidas por vencimento hoje e próximos dias). A tela disponibiliza transição rápida de status (**A fazer**, **Em andamento**, **Concluída**, **Cancelada**) com persistência de `completedAt` e `cancelledAt` no banco de dados e exibição de um bloco de **KPIs de Desempenho Individual** (Total Atribuído, Concluídas, Pendentes, Em Atraso e Taxa de Pontualidade).

## Technical Context

**Language/Version**: TypeScript 5 (`strict: true`), React 19.3.0, Next.js 16.4.3 (App Router)  
**Primary Dependencies**: Prisma ORM 6.19.3, Zod 3.25.76, `@tanstack/react-table` 8.21.3, `tailwind-variants` 0.3.1, `shadcn/ui` (Radix UI), `lucide-react`, `sonner`  
**Storage**: PostgreSQL (Neon Serverless) via Prisma (`TaskStatus` enum + campos `completedAt`, `cancelledAt` em `Task`)  
**Testing**: `tsx --test` via `npm test` (`node scripts/run-tests.mjs`), `@testing-library/react`, `@playwright/test`  
**Target Platform**: Web Application (Desktop e Mobile-First `>= 320px`)  
**Project Type**: Full-stack Next.js Web Application (App Router + Server Actions) em `stem-erp/`  
**Performance Goals**: Renderização inicial e filtragem local instantâneas (< 50ms no cliente); atualização otimista/Server Action < 500ms  
**Constraints**: Zero cores hardcoded (apenas tokens semânticos), `tv()` fora de componentes, `pageSize: 10` fixo, menu de engrenagem (`Settings`) para ações de linha, proteção contra comandos destrutivos de banco (`db:safe-push`), modo leitura para `AUDITOR`  
**Scale/Scope**: Equipes STEM de 5 a 50 integrantes e 50 a 500 tarefas por temporada

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Clean Architecture & SOLID**: ✅ Aprovado — Lógica de cálculo de prazos, ordenação e KPIs isolada em `src/lib/my-activities.ts`; estado e filtros no custom hook `src/components/tasks/use-my-activities.ts`; componentes de UI puros e menores que 150 linhas (`my-activities-view.tsx`, `my-activities-kpis.tsx`).
- **II. Design System Semântico & Zero Hardcoding**: ✅ Aprovado — Uso exclusivo de tokens semânticos (`bg-card`, `text-foreground`, `text-destructive`, `text-success`, `text-warning`, `border-border`) e `tailwind-variants` (`tv()`) fora do corpo dos componentes.
- **III. Tipagem Estrita & Zod**: ✅ Aprovado — Zero `any`; validação de entrada de mudança de status com Zod (`updateMyTaskStatusSchema`).
- **IV. Testes Automatizados Obrigatórios**: ✅ Aprovado — Plano inclui testes unitários para cálculo de prazos e KPIs, testes de validação Zod, testes de hook/componente (4 estados de UI) e integração do serviço.
- **V. Layout Shell Padronizado, Mobile-First & Padrões de Tabela**: ✅ Aprovado — Integrado ao `<DashboardShell>` via `TasksView` com `title` e `subtitle` próprios; paginação fixa em 10 itens com 4 botões; menu de engrenagem (`Settings`) para ações; design mobile-first.
- **VI. Multitenancy, Segurança & Auditoria**: ✅ Aprovado — Isolado por `teamId` no `resolveTaskScope`; `AUDITOR` bloqueado para mutações; controle de concorrência otimista via `revision`.
- **XII. Guardrails de Banco de Dados**: ✅ Aprovado — Uso obrigatório de `npm run db:backup` e `npm run db:safe-push` antes de alterar o banco.

*Reavaliação Pós-Design (Phase 1)*: Todos os artefatos (`data-model.md`, `contracts/task-status-and-kpis.md`, `quickstart.md`) preservam 100% da conformidade constitucional sem necessidade de exceções ou justificativas de complexidade.

## Project Structure

### Documentation (this feature)

```text
specs/007-minhas-atividades/
├── spec.md                                # Especificação funcional
├── plan.md                                # Este arquivo
├── research.md                            # Decisões técnicas e alternativas
├── data-model.md                          # Extensão de schema, tipos e regras de transição
├── quickstart.md                          # Guia de validação e comandos
├── checklists/
│   └── requirements.md                    # Checklist de qualidade da spec
└── contracts/
    └── task-status-and-kpis.md            # Contratos de Server Action, Serviço e UI
```

### Source Code (`stem-erp/`)

```text
stem-erp/
├── prisma/
│   └── schema.prisma                      # + CANCELLED em TaskStatus; + completedAt, cancelledAt em Task
├── src/
│   ├── types/
│   │   └── tasks.ts                       # + currentUserId em TaskWorkspace; + completedAt/cancelledAt; + CANCELLED label
│   ├── lib/
│   │   ├── task-navigation.ts             # + view "my-activities" em TASK_VIEWS
│   │   ├── my-activities.ts               # Funções puras: prazos, ordenação e cálculo de KPIs
│   │   ├── validations/
│   │   │   └── tasks.ts                   # + updateMyTaskStatusSchema e status CANCELLED
│   │   └── __tests__/
│   │       └── my-activities.test.ts      # Testes unitários de prazos, ordenação e KPIs
│   ├── services/
│   │   ├── task-service.ts                # + updateTaskStatus com completedAt/cancelledAt e currentUserId no workspace
│   │   └── __tests__/
│   │       └── task-service.integration.test.ts # Cobertura de updateTaskStatus e CANCELLED
│   ├── actions/
│   │   └── tasks.actions.ts               # + updateMyTaskStatusAction
│   └── components/
│       ├── layout/
│       │   └── task-nav-group.tsx         # Ícone para "my-activities" na barra lateral
│       └── tasks/
│           ├── tasks-view.tsx             # Renderiza MyActivitiesView quando viewId === "my-activities"
│           ├── use-my-activities.ts       # Custom hook: filtros, busca, paginação (10/pág) e troca de status
│           ├── my-activities-kpis.tsx     # Bloco de KPIs de desempenho individual com tv()
│           ├── my-activities-view.tsx     # Lista/tabela responsiva com engrenagem, status e paginação padrão
│           └── __tests__/
│               └── my-activities-view.test.tsx # Testes de componente (Loading/Empty/Success/Error, filtros, status)
└── e2e/
    └── my-activities.spec.ts              # Fluxo E2E desktop e mobile (375px)
```

**Structure Decision**: Expansão direta da arquitetura modular existente em `stem-erp/src/`, reaproveitando a rota `/tarefas` com parâmetro `?tab=my-activities` integrada ao `DashboardShell` e `TaskNavGroup`.

## Complexity Tracking

Nenhuma violação constitucional identificada.
