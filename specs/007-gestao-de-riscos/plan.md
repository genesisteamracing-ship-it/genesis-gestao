# Implementation Plan: Módulo de Gestão de Riscos e Oportunidades

**Branch**: `007-gestao-de-riscos` | **Date**: 2026-11-12 | **Spec**: [spec.md](file:///c:/Users/N01/OneDrive/Documentos/agenesis-gesta/specs/007-gestao-de-riscos/spec.md)

**Input**: Feature specification from `/specs/007-gestao-de-riscos/spec.md`

## Summary

Implementação do módulo completo de **Gestão de Riscos e Oportunidades** na rota `/riscos` do `stem-erp`, permitindo cadastro contínuo ao longo do ciclo de vida do projeto, priorização automática em matriz 5×5 (com suporte a `None` em Probabilidade e Consequência), registro de estratégias proativas, planos de contingência, observações e evidências, além de histórico de revisões periódicas. A interface entrega dois gráficos de pizza (`%` por Chance e `%` por Consequência), um gráfico em plano cartesiano com bolinhas (`ScatterChart` via `Recharts`) e a tabela padronizada com as colunas **Setor**, **Probabilidade de ocorrer**, **Consequência de ocorrência**, **Risco** e **Observações**.

## Technical Context

**Language/Version**: TypeScript 5 (`strict: true`), React 19.3.0, Next.js 16.4.3 (App Router)  
**Primary Dependencies**: `shadcn/ui` (Radix UI), `tailwind-variants` (`tv`), `lucide-react`, `recharts` 3.10.1, `@tanstack/react-table` 8.21.3, `react-hook-form` + `zod`, `sonner`  
**Storage**: PostgreSQL (Neon Serverless) via Prisma ORM 6.19.3 (`RiskItem` e `RiskReview` vinculados a `Team` e `season`)  
**Testing**: `tsx --test` via `node scripts/run-tests.mjs` + `@testing-library/react` + Playwright (`e2e/`)  
**Target Platform**: Web (Desktop e Mobile-first a partir de 375px), hospedado em Render  
**Project Type**: Aplicação Web Fullstack (Next.js App Router + Server Actions) em `stem-erp/`  
**Performance Goals**: Recalcular filtros, gráficos de pizza, plano cartesiano e paginação instantaneamente no cliente sem chamadas redundantes ao servidor; mutações persistidas com revalidação imediata  
**Constraints**: Zero hardcoding de cores (apenas tokens semânticos), `pageSize: 10` fixo na tabela, menu de engrenagem (`Settings` + `DropdownMenu`) por linha, `<DashboardShell>` obrigatório com `title` e `subtitle`, zero comandos destrutivos de banco (`npm run db:backup` + `npm run db:safe-push`)  
**Scale/Scope**: Multitenant por `teamId` e `season`, suportando dezenas/centenas de riscos e oportunidades por equipe com histórico completo de revisões

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **Clean Architecture & SOLID**: Lógica pura de priorização/estatísticas isolada em `src/lib/risk-matrix.ts`; validações Zod em `src/lib/risk-schemas.ts`; estado e filtros em `src/hooks/use-risks.ts`; componentes de UI enxutos (<150 linhas) separados por responsabilidade. **PASS**.
2. **Design System Semântico & Zero Hardcoding**: Todos os componentes e séries do Recharts utilizam variáveis CSS semânticas (`var(--destructive)`, `var(--warning)`, `var(--primary)`, `var(--success)`, `var(--muted-foreground)`, `var(--border)`, etc.) e `tailwind-variants` (`tv`). **PASS**.
3. **Tipagem Estrita & Zod**: Zero `any`; todas as Server Actions e formulários validados com `safeParse` do Zod. **PASS**.
4. **Testes Automatizados Obrigatórios**: Testes unitários para matriz/estatísticas/schemas, testes de componente para os 4 estados de UI (Loading, Error, Empty, Success) e interações, e E2E Playwright em `e2e/risks.spec.ts`. **PASS**.
5. **Layout Shell, Mobile-First, Tabela & Paginação**: Rota `/riscos` envolvida por `<DashboardShell>` com `title` e `subtitle`; tabela `@tanstack/react-table` com `pageSize: 10` fixo, 4 botões de navegação e menu de engrenagem. **PASS**.
6. **Multitenancy, Segurança & Auditoria**: Modelos isolados por `teamId`, chave `"risks"` adicionada ao RBAC (`SystemModuleKey`) e bloqueio de mutações para `AUDITOR`. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/007-gestao-de-riscos/
├── plan.md              # Este arquivo
├── research.md          # Decisões técnicas e alternativas avaliadas
├── data-model.md        # Modelos Prisma, enums e transições de estado
├── quickstart.md        # Guia de validação ponta a ponta
├── contracts/
│   └── risk-actions.md  # Contratos das Server Actions e DTOs
└── tasks.md             # Gerado posteriormente via /speckit-tasks
```

### Source Code (`stem-erp/`)

```text
stem-erp/
├── prisma/
│   └── schema.prisma                              # Enums e modelos RiskItem e RiskReview
├── src/
│   ├── types/
│   │   ├── auth.ts                                # Inclusão de "risks" em SystemModuleKey
│   │   └── risks.ts                               # DTOs e tipos do domínio de riscos
│   ├── lib/
│   │   ├── permissions.ts                         # Metadados e defaults de permissão para "risks"
│   │   ├── risk-matrix.ts                         # Pesos, score 5x5, distribuição %, coordenadas cartesianas
│   │   └── risk-schemas.ts                        # Esquemas Zod (criação, edição, revisão)
│   ├── actions/
│   │   └── risk-actions.ts                        # Server Actions multitenant + RBAC + Zod
│   ├── hooks/
│   │   └── use-risks.ts                           # Orquestração de estado, filtros, modais e mutações
│   ├── components/
│   │   ├── layout/
│   │   │   └── app-sidebar.tsx                    # Link de navegação para /riscos
│   │   └── risks/
│   │       ├── risks-view.tsx                     # Orquestração da tela (Loading/Error/Empty/Success)
│   │       ├── risk-distribution-charts.tsx       # 2 gráficos de pizza (% Chance e % Consequência)
│   │       ├── risk-cartesian-chart.tsx           # Plano cartesiano em bolinhas (Probabilidade × Consequência)
│   │       ├── risk-table.tsx                     # Tabela padronizada (5 colunas + engrenagem + paginação 10)
│   │       ├── risk-form-dialog.tsx               # Modal de criação/edição com alinhamento padrão
│   │       └── risk-review-dialog.tsx             # Modal de revisão periódica + histórico cronológico
│   ├── app/
│   │   └── riscos/
│   │       └── page.tsx                           # Página /riscos com DashboardShell
│   └── __tests__/
│       ├── risk-matrix.test.ts                    # Testes unitários de cálculo e gráficos
│       ├── risk-schemas.test.ts                   # Testes unitários de validação Zod
│       └── risks-view.test.tsx                    # Testes de componente (4 estados + interações)
└── e2e/
    └── risks.spec.ts                              # Teste E2E Playwright (desktop + mobile)
```

**Structure Decision**: A implementação segue a arquitetura App Router já consolidada em `stem-erp/`, reutilizando `DashboardShell`, `SeasonProvider`, `DeliveryGroup` (setores) e o sistema de permissões por módulo (`SystemModuleKey`).

## Complexity Tracking

Nenhuma violação à Constituição identificada; não há desvios arquiteturais a justificar.
