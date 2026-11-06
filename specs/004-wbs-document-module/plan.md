# Implementation Plan: Módulo Documentos e Estrutura Analítica do Projeto (WBS / EAP)

**Branch**: `004-wbs-document-module` | **Date**: 2026-11-06 | **Spec**: [spec.md](file:///c:/Users/N01/OneDrive/Documentos/agenesis-gesta/specs/004-wbs-document-module/spec.md)

**Input**: Feature specification from `specs/004-wbs-document-module/spec.md`

## Summary

Implementação do novo módulo de **Documentos** com a funcionalidade de **WBS (Work Breakdown Structure / EAP — Estrutura Analítica do Projeto)**. A solução permite a decomposição hierárquica do escopo total da temporada da escuderia STEM Racing em múltiplos níveis (Projeto -> Grandes Áreas / Subsistemas -> Pacotes de Trabalho), aplicando a Regra dos 100% através de agregação automática (*roll-up*) de custos e horas. Inclui um "Modo Apresentação / Juízes" para auditorias de Project Management, menu de ações por linha padronizado com botão de engrenagem, e total aderência às diretrizes constitucionais de layout shell (`<DashboardShell>`), tipagem estrita e valores em centavos.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+  
**Primary Dependencies**: Next.js 15+ (App Router, Server Actions), React 19, Tailwind CSS v4, `tailwind-variants` (`tv`), Radix UI / `shadcn/ui`, `lucide-react`, Zod  
**Storage**: PostgreSQL (Neon Serverless) via Prisma ORM  
**Testing**: `node:test` com `tsx` (`npm test`), Testing Library, Playwright e2e  
**Target Platform**: Web responsivo (Mobile-first, tablets e desktops)  
**Project Type**: Aplicação Web Fullstack corporativa / esportiva  
**Performance Goals**: Tempo de renderização/expansão de nós da árvore < 500ms; cálculo de roll-up instantâneo (< 10ms)  
**Constraints**: Regra dos 100% estrita, valores monetários obrigatoriamente em centavos inteiros (`amountCents: Int`), ausência total de cores hexadecimais arbitrarias, layout shell obrigatório com título e subtítulo contextuais  
**Scale/Scope**: Escuderias STEM Racing (~30 a 200 entregáveis por temporada, hierarquia de 1 a 5 níveis)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio Constitucional | Status | Justificativa / Mecanismo de Conformidade |
| :--- | :---: | :--- |
| **I. Clean Architecture & SOLID** | PASS | Separação estrita: componentes UI desacoplados, regras de agregação em `wbs-rollup.service.ts`, mutações via Server Actions validadas por Zod. Componentes modulares < 150 linhas. |
| **II. Design System & Zero Hardcoding** | PASS | Uso exclusivo de tokens semânticos (`bg-background`, `text-foreground`, `border-border`, `text-primary`, etc.). Variantes construídas com `tailwind-variants` (`tv`). |
| **III. Tipagem Estrita & Centavos** | PASS | Zero uso de `any`. Valores monetários armazenados e somados como inteiros em centavos (`estimatedCostCents`, `rolledUpCostCents`). |
| **IV. Testes Automatizados** | PASS | Testes unitários para a função de roll-up da Regra dos 100% e esquemas Zod, além de testes de renderização e estados de UI. |
| **V. Layout Shell & Mobile-First** | PASS | Uso compulsório de `<DashboardShell>` com `title="Documentos"` e `subtitle="Estrutura Analítica do Projeto (WBS / EAP) e Decomposição de Escopo"`. Barra lateral fixa, gaveta mobile e menu de engrenagem (`Settings` + `DropdownMenu`) para ações em linha. |
| **VI. Multitenancy & Segurança** | PASS | Isolamento estrito por `teamId`, autenticação de sessão e permissão de módulo integrada em `AuthenticatedUserDTO`. |

## Project Structure

### Documentation (this feature)

```text
specs/004-wbs-document-module/
├── spec.md              # Especificação de requisitos da funcionalidade
├── plan.md              # Este plano de implementação
├── research.md          # Decisões tecnológicas e padrões arquiteturais
├── data-model.md        # Modelagem de dados Prisma e tipos de domínio
├── quickstart.md        # Guia de validação ponta a ponta
├── checklists/
│   └── requirements.md  # Validação de qualidade de especificação
└── contracts/
    └── wbs-contract.md  # Contratos de Zod, Server Actions e Props de UI
```

### Source Code (repository root: `stem-erp/`)

```text
stem-erp/
├── prisma/
│   └── schema.prisma                           # Modelo WbsNode e extensão do User
├── src/
│   ├── actions/
│   │   └── wbs.actions.ts                      # Server Actions para consulta, criação, edição e exclusão de nós
│   ├── app/
│   │   └── documentos/
│   │       └── page.tsx                        # Página principal do módulo Documentos / WBS
│   ├── components/
│   │   ├── layout/
│   │   │   ├── app-sidebar.tsx                 # Adição do módulo Documentos à navegação
│   │   │   └── mobile-nav-drawer.tsx           # Adição do módulo à gaveta mobile
│   │   └── wbs/
│   │       ├── wbs-header-metrics.tsx          # Cartões de métricas consolidadas (Total, Custo, Horas, Cobertura)
│   │       ├── wbs-tree-table.tsx              # Tabela / árvore hierárquica colapsável de entregáveis
│   │       ├── wbs-row-actions.tsx             # Menu de engrenagem para ações da linha
│   │       ├── wbs-node-modal.tsx              # Modal de criação / edição de entregáveis e sub-entregáveis
│   │       └── wbs-presentation-view.tsx       # Visão limpa de apresentação para juízes de Project Management
│   ├── hooks/
│   │   └── use-wbs.ts                          # Custom hook para gerenciar expansão, filtros e mutações da WBS
│   ├── lib/
│   │   └── validations/
│   │       └── wbs.schema.ts                   # Esquemas declarativos Zod
│   ├── services/
│   │   └── wbs-rollup.service.ts               # Algoritmo puro de agregação de custos e horas (Regra dos 100%)
│   └── types/
│       ├── auth.ts                             # Extensão de permissões (canAccessDocuments)
│       └── wbs.ts                              # Tipos TypeScript da árvore e métricas
└── tests/
    └── wbs/
        ├── wbs-rollup.test.ts                  # Testes unitários de agregação matemática e Regra dos 100%
        └── wbs-schema.test.ts                  # Testes unitários dos esquemas de validação Zod
```

**Structure Decision**: A estrutura segue a arquitetura padrão do `stem-erp/`, utilizando Next.js App Router, componentes modulares com `tv()`, camada de services pura para as regras de negócio de agregação de escopo e Server Actions tipadas.

## Complexity Tracking

> **Nenhuma violação constitucional.** Todos os princípios (SOLID, tokens semânticos, centavos inteiros, testes obrigatórios e layout shell) foram integralmente respeitados no design.
