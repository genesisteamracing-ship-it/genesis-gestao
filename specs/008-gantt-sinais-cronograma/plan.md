# Implementation Plan: Sinais de Status, Linha de Base e Caminho Crítico no Gantt

**Branch**: `008-gantt-sinais-cronograma` | **Date**: 2026-11-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/008-gantt-sinais-cronograma/spec.md`

## Summary

Evoluir a criação/edição de tarefas e a visualização do Gantt em `/tarefas` para atender integralmente aos critérios do avaliador de gestão de projetos:
1. Persistência aditiva de **Linha de Base** (`baselineStartDate`, `baselineEndDate`), flag manual de atenção (`isAtRisk`) e flag manual de atividade crítica (`isCritical`) no modelo `Task`, preservando compatibilidade total com tarefas legadas.
2. Camada pura de cálculo (`task-gantt-metrics.ts`) para ID curto sequencial (`A..Z, AA..`), semáforo de status (`Em dia`, `Atenção`, `Atrasada`, `Concluída`), cálculo híbrido de Caminho Crítico (CPM com folga zero + override manual) e agregação dos 4 cards executivos.
3. Interface do Gantt com **4 cards executivos no topo** (`Progresso geral`, `Atividades críticas`, `Desvio atual`, `Marco final`), coluna estruturada `ID | Atividade`, barra cinza de linha de base pareada à barra colorida de execução, destaque de linha crítica com contorno vermelho + losango `◇` + rótulo `Crítica`, ícone ✓ em concluídas e painel `Legenda (status)` completo usando exclusivamente tokens semânticos e `tailwind-variants`.

## Technical Context

**Language/Version**: TypeScript 5 (`strict: true`), Node.js 20, React 19, Next.js 16 (App Router + Server Actions)

**Primary Dependencies**: Prisma 6, Zod, `shadcn/ui` (Radix UI), Tailwind CSS 4, `tailwind-variants` (`tv`), `lucide-react`, `sonner`

**Storage**: PostgreSQL (Neon Serverless) via Prisma ORM — migração estritamente aditiva (`baselineStartDate`, `baselineEndDate`, `isAtRisk`, `isCritical`) aplicada via `npm run db:backup` + `npm run db:safe-push`

**Testing**: `tsx --test` (`npm test`) para unitários/domínio/validação, Testing Library para componentes e Playwright (`e2e/`) para desktop (`1280x720`) e mobile (`375x667`)

**Target Platform**: Navegadores desktop e mobile (mobile-first), hospedado no Render

**Project Type**: Evolução de módulo web existente (`/tarefas` dentro de `stem-erp/`)

**Performance Goals**: Recálculo instantâneo (< 16ms em memória) do CPM, semáforo e dos 4 cards para até 200 tarefas ao filtrar por setor ou editar/redimensionar datas

**Constraints**: Zero cores hardcoded (tokens semânticos obrigatórios), isolamento por `teamId`, perfil `AUDITOR` somente leitura, zero comandos destrutivos de banco de dados (Regra 12), alinhamento nivelado de labels/inputs (Regra 13), minimalismo visual sem banners didáticos redundantes (Regra 14)

**Scale/Scope**: Evolução de `TaskForm`, `TaskGantt`, `task-service.ts`, `tasks.actions.ts`, `validations/tasks.ts`, novo módulo puro `task-gantt-metrics.ts` e 2 novos componentes coesos (`task-gantt-kpis.tsx` e `task-gantt-legend.tsx`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Pré-pesquisa | Pós-desenho (Phase 1) |
| --- | --- | --- |
| **I. Clean Architecture & SOLID** | Regras de semáforo, CPM e KPIs não podem ficar misturadas no JSX do Gantt. | Aprovado — toda lógica matemática isolada em `src/lib/task-gantt-metrics.ts`; UI quebrada em `task-gantt-kpis.tsx` (< 120 linhas) e `task-gantt-legend.tsx` (< 80 linhas). |
| **II. Design System Semântico & `tv`** | Cores da imagem (verde, amarelo, vermelho, cinza) devem mapear para tokens semânticos (`success`, `warning`, `destructive`, `muted`), nunca hex. | Aprovado — variantes definidas via `tv()` fora dos componentes usando exclusivamente tokens semânticos do tema. |
| **III. Tipagem Estrita & Zod** | Zero `any`; validação Zod de datas planejadas e reais. | Aprovado — `createTaskSchema` e `editTaskSchema` estendidos com `safeParse` e refines de intervalo válido. |
| **IV. Testes Automatizados** | Cobrir funções puras (CPM, semáforo, KPIs), Zod, componentes e E2E. | Aprovado — plano de testes unitários, integração de componentes e E2E definido em [quickstart.md](quickstart.md). |
| **V. Layout Shell, Mobile-First & a11y** | Manter `<DashboardShell>` em `/tarefas`, grade responsiva nos 4 cards, sinais acessíveis além de cor. | Aprovado — `role="progressbar"`, rótulos textuais (`Em dia`, `Atenção`, `Atrasada`, `Concluída`, `Crítica`), ícone ✓, losango ◇ e layout mobile-first. |
| **VI. Multitenancy, Auditoria & Zero Reset** | Isolamento `teamId`, bloqueio `AUDITOR`, backup antes de alterar schema. | Aprovado — migração aditiva com colunas opcionais/default, executada apenas após `npm run db:backup` e via `npm run db:safe-push`. |

## Project Structure

### Documentation (this feature)

```text
specs/008-gantt-sinais-cronograma/
├── spec.md                    # Especificação funcional consolidada
├── plan.md                    # Este arquivo (/speckit-plan)
├── research.md                # Decisões técnicas e algoritmos (CPM, semáforo, KPIs)
├── data-model.md              # Schema aditivo Prisma e tipos derivados
├── quickstart.md              # Roteiro de validação e quality gates
├── checklists/
│   └── requirements.md        # Checklist de qualidade da spec (16/16)
├── contracts/
│   └── gantt-signals.md       # Contratos Zod, Server Actions e props de UI
└── tasks.md                   # Gerado no próximo passo (/speckit-tasks)
```

### Source Code (repository root)

```text
stem-erp/
├── prisma/
│   └── schema.prisma                                      # + baselineStartDate, baselineEndDate, isAtRisk, isCritical em Task
├── src/
│   ├── types/
│   │   └── tasks.ts                                       # + campos de baseline e flags em TaskRecord
│   ├── lib/
│   │   ├── task-gantt-metrics.ts                          # [NOVO] ID curto, semáforo, CPM e resumo dos 4 cards
│   │   ├── __tests__/
│   │   │   └── task-gantt-metrics.test.ts                 # [NOVO] Testes unitários 100% determinísticos
│   │   └── validations/
│   │       ├── tasks.ts                                   # + validação de baseline, isAtRisk e isCritical
│   │       └── __tests__/
│   │           └── tasks-validation.test.ts               # [NOVO] Testes dos schemas Zod
│   ├── services/
│   │   └── task-service.ts                                # Persistência e fallback de baseline/flags
│   ├── actions/
│   │   └── tasks.actions.ts                               # Repasse tipado dos novos campos
│   └── components/
│       └── tasks/
│           ├── task-form.tsx                              # Edição de baseline + flags Atenção/Crítica (labels nivelados)
│           ├── task-gantt-kpis.tsx                        # [NOVO] 4 cards executivos no topo do Gantt
│           ├── task-gantt-legend.tsx                      # [NOVO] Painel Legenda (status) com os 5 sinais
│           ├── task-gantt.tsx                             # Coluna ID|Atividade, barra cinza + status, destaque crítico
│           └── __tests__/
│               └── task-gantt-signals.test.tsx            # [NOVO] Testes de componente dos cards, sinais e legenda
└── e2e/
    └── tarefas-gantt-sinais.spec.ts                       # [NOVO] Fluxo E2E desktop + mobile
```

**Structure Decision**: Manter integralmente a estrutura consolidada dentro de `stem-erp/`, isolando toda a nova lógica de cálculo em `src/lib/task-gantt-metrics.ts` e decompondo os novos blocos visuais em componentes dedicados (`task-gantt-kpis.tsx` e `task-gantt-legend.tsx`) para preservar baixo acoplamento e manter os componentes enxutos.

## Complexity Tracking

Nenhuma violação à Constituição identificada — todas as decisões respeitam rigorosamente os 6 princípios e as regras de banco de dados, design system e testes.
