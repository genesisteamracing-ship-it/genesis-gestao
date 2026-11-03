# Implementation Plan: Mapa Organizacional e Hierárquico de Stakeholders na Comunicação

**Branch**: `001-stakeholder-hierarchy-map` | **Date**: 2026-11-03 | **Spec**: [spec.md](file:///c:/Users/N01/OneDrive/Documentos/agenesis-gesta/specs/001-stakeholder-hierarchy-map/spec.md)

**Input**: Feature specification from `/specs/001-stakeholder-hierarchy-map/spec.md`

## Summary

Substituir a visualização principal da página de Comunicação (`/comunicacao`) por um **Mapa Organizacional e Hierárquico Interativo** (inspirado no padrão visual "Organization Map"), no qual cada Parceiro/Organização (ex: `SESI`, `SENAI`, patrocinadores) atua como um ramo principal conectado à equipe, e seus múltiplos stakeholders são encadeados verticalmente em níveis hierárquicos de acordo com seu nível de **Poder e Interesse** sobre o projeto (ex: `SESI` → `Diretoria` → `Técnicos` → `Professores`) ou subordinação direta opcional (`parentStakeholderId`). A solução inclui cartões de planos/ações de comunicação em andamento na base da árvore, controles interativos de busca, filtro por parceiro, zoom/enquadramento, minimapa e inspeção contextual de nós para disparo de relatórios e feedbacks, seguindo estritamente os padrões do **Frontend Engineer** (`AGENTS.md` e Constituição do projeto).

## Technical Context

**Language/Version**: TypeScript 5.x (`strict: true`, zero `any`) sobre Node.js 20+  
**Primary Dependencies**: Next.js 16.4.3 (App Router, RSC, Server Actions), React 19.3.0, Tailwind CSS v4, `shadcn/ui` (Radix UI primitives), `tailwind-variants` (`tv` v0.3.1), `react-hook-form` + `zod` (v3.25), `lucide-react`  
**Storage**: PostgreSQL (Neon Serverless) via Prisma ORM (`v6.19.3`)  
**Testing**: Node.js native test runner via `tsx --test` (`npm test`) para testes unitários, validação Zod e algoritmo de árvore hierárquica  
**Target Platform**: Web Application Responsiva (Mobile-First `320px+` até Desktop `1600px+`)  
**Project Type**: Full-stack Web Application (Next.js App Router em `stem-erp/`)  
**Performance Goals**: Renderização instantânea de árvores com até 15 parceiros e 60 stakeholders a 60fps; execução da suíte de testes automatizados em `< 3s`  
**Constraints**: Zero cores hexadecimais/arbitrárias hardcoded (uso exclusivo de tokens semânticos do Design System); componentes visuais com no máximo 150 linhas (Princípio SRP); uso obrigatório do `<DashboardShell>` com `<AppSidebar>` fixa  
**Scale/Scope**: Módulo de Comunicação & Engajamento multi-equipe (`teamId`) em `stem-erp/src/`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio da Constituição | Status Pré-Design | Avaliação Pós-Design (Phase 1) |
|---------------------------|-------------------|--------------------------------|
| **I. Clean Architecture & Princípios SOLID** | ✅ PASS | Lógica de construção da árvore isolada em função pura (`src/lib/communication-hierarchy.ts`) e estado interativo em Custom Hook (`src/hooks/use-stakeholder-org-map.ts`). Componentes visuais divididos em unidades coesas `< 150` linhas (`StakeholderOrgMap`, `OrgMapNodeCard`, `OrgMapPlanCard`, `StakeholderInspectorDialog`). |
| **II. Design System Semântico & Zero Hardcoding** | ✅ PASS | Todos os nós, linhas conectoras, badges de status e barras de progresso utilizam exclusivamente tokens semânticos (`bg-background`, `bg-card`, `border-border`, `text-primary`, `text-purple`, `text-success`, `text-warning`, `text-amber`, `text-muted-foreground`) e `tailwind-variants` (`tv`) com `slots` e `VariantProps`. |
| **III. Tipagem Estrita, Zod & Padrão Monetário** | ✅ PASS | Zero `any`; novos tipos `OrgMapPartnerBranch`, `OrgMapStakeholderNode`, `HierarchyTier` e schema Zod `createStakeholderSchema` estendido com `parentStakeholderId`. |
| **IV. Testes Automatizados Obrigatórios** | ✅ PASS | Cobertura de testes unitários para `buildStakeholderHierarchyTree` (validando o encadeamento `SESI → Diretoria → Técnicos → Professores`, subordinação explícita, busca e filtros) e validações Zod em `src/components/communication/__tests__/`. |
| **V. Layout Shell Padronizado, Mobile-First & Estados de UI** | ✅ PASS | Página mantida dentro de `<DashboardShell>`, responsiva Mobile-First (canvas com scroll/pan tátil e controles adaptativos) e contemplando os 4 estados de UI (*Loading*, *Error*, *Empty State* e *Success*). |
| **VI. Multitenancy, Segurança & Trilha de Auditoria** | ✅ PASS | Todas as consultas e mutações filtram estritamente por `teamId` e respeitam o bloqueio de escrita para o perfil `AUDITOR`. |

## Project Structure

### Documentation (this feature)

```text
specs/001-stakeholder-hierarchy-map/
├── plan.md              # Este arquivo (/speckit-plan)
├── research.md          # Phase 0 output (decisões de arquitetura e algoritmo de árvore)
├── data-model.md        # Phase 1 output (evolução do modelo Stakeholder e DTOs da árvore)
├── quickstart.md        # Phase 1 output (guia de execução e validação)
├── contracts/           # Phase 1 output (contratos de Server Actions, Hook e Componentes)
│   └── ui-and-actions-contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks - gerado no próximo comando)
```

### Source Code (repository root)

```text
stem-erp/
├── prisma/
│   ├── schema.prisma                                            # Adição opcional de parentStakeholderId em Stakeholder
│   └── seed.ts                                                  # Dados de exemplo hierárquicos (ex: SESI -> Diretoria -> Técnicos -> Professores)
└── src/
    ├── actions/
    │   └── communication-actions.ts                             # Suporte a parentStakeholderId e atualização rápida de hierarquia
    ├── app/
    │   └── comunicacao/
    │       └── page.tsx                                         # Página RSC carregando dados para o Mapa Organizacional
    ├── components/
    │   └── communication/
    │       ├── communication-view.tsx                           # View principal priorizando a aba/visão do Mapa Organizacional
    │       ├── create-stakeholder-dialog.tsx                    # Formulário atualizado com seleção de Parceiro e Superior Hierárquico opcional
    │       ├── org-map/
    │       │   ├── stakeholder-org-map.tsx                      # Container interativo do Organization Map (Header, Modos, Canvas, Minimapa)
    │       │   ├── org-map-node-card.tsx                        # Cartão semântico de Nó (Equipe, Parceiro, Stakeholder por nível de Poder/Interesse)
    │       │   ├── org-map-plan-card.tsx                        # Cartão inferior de Plano/Ação em andamento ("In Progress")
    │       │   └── stakeholder-inspector-dialog.tsx             # Modal/gaveta contextual ao clicar em um nó do gráfico
    │       └── __tests__/
    │           ├── communication-hierarchy.test.ts              # Testes unitários do motor hierárquico (SESI -> Diretoria -> Técnicos -> Professores)
    │           ├── communication-templates.test.ts              # Testes existentes preservados
    │           └── communication-validations.test.ts            # Testes de validação Zod atualizados
    ├── hooks/
    │   └── use-stakeholder-org-map.ts                           # Custom Hook com estado de filtros, busca, zoom, modo de visão e seleção de nós
    ├── lib/
    │   ├── communication-hierarchy.ts                           # Algoritmo puro de construção da árvore hierárquica por Parceiro e Poder/Interesse
    │   └── validations/
    │       └── communication.ts                                 # Schema Zod atualizado com parentStakeholderId
    ├── services/
    │   └── communication-service.ts                             # Persistência e leitura de parentStakeholderId no Prisma
    └── types/
        └── communication.ts                                     # Tipagens estritas da árvore organizacional (StakeholderOrgMapTree, etc.)
```

**Structure Decision**: A aplicação reside em `stem-erp/` seguindo a arquitetura modular Next.js App Router do projeto. Os novos componentes visuais do gráfico organizacional ficam agrupados em `stem-erp/src/components/communication/org-map/`, mantendo cada arquivo abaixo de 150 linhas, enquanto a lógica pura de construção da árvore fica em `stem-erp/src/lib/communication-hierarchy.ts` e o gerenciamento de estado em `stem-erp/src/hooks/use-stakeholder-org-map.ts`.

## Complexity Tracking

> Nenhuma violação à Constituição foi introduzida. Todos os Quality Gates foram aprovados sem necessidade de exceções arquiteturais.
