# Tasks: Módulo de Gestão de Riscos e Oportunidades

**Input**: Design documents from `/specs/007-gestao-de-riscos/`  
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/risk-actions.md`, `quickstart.md`

**Tests**: Obrigatórios conforme Constituição do projeto (unitários de matriz/schemas, testes de componente cobrindo os 4 estados de UI e E2E Playwright em `e2e/risks.spec.ts`).

**Organization**: Tarefas organizadas por história de usuário (`US1`, `US2`, `US3`) para permitir entrega incremental e validação independente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode ser executada em paralelo (arquivos distintos, sem dependências pendentes)
- **[Story]**: História de usuário associada (`[US1]`, `[US2]`, `[US3]`)
- Todos os caminhos são relativos à raiz do repositório (`stem-erp/...`).

---

## Phase 1: Setup (Infraestrutura Compartilhada)

**Purpose**: Preparação de backup, tipos compartilhados e registro do módulo no controle de acesso e navegação.

- [X] T001 Executar backup pré-migração do banco via `npm run db:backup` em `stem-erp/scripts/db-backup-sync.ts`
- [X] T002 [P] Definir tipos e DTOs de riscos (`RiskItemDTO`, `RiskReviewDTO`, `DistributionSlice`, `CartesianPoint`) em `stem-erp/src/types/risks.ts`
- [X] T003 [P] Adicionar chave `"risks"` em `SystemModuleKey` em `stem-erp/src/types/auth.ts`
- [X] T004 Registrar metadados e permissões padrão do módulo `"risks"` (leitura para `AUDITOR`, leitura/escrita para editores) em `stem-erp/src/lib/permissions.ts`

---

## Phase 2: Foundational (Pré-requisitos Bloqueantes)

**Purpose**: Schema do banco, funções puras de domínio (matriz 5×5, estatísticas e coordenadas cartesianas) e esquemas Zod.

**⚠️ CRITICAL**: Nenhuma User Story pode ser iniciada antes da conclusão desta fase.

- [X] T005 Adicionar enums (`RiskEntryType`, `RiskProbability`, `RiskConsequence`, `RiskLifecycleStatus`, `RiskPriorityLevel`) e modelos `RiskItem` (vinculado a `Team`, `season`, `DeliveryGroup`) e `RiskReview` (`onDelete: Cascade`) em `stem-erp/prisma/schema.prisma`
- [X] T006 Executar sincronização segura do schema (`npm run db:safe-push`) e gerar Prisma Client em `stem-erp/prisma/schema.prisma`
- [X] T007 [P] Implementar cálculos puros de priorização 5×5 (`calculateRiskPriority`), distribuições percentuais para pizza (`buildProbabilityDistribution`, `buildConsequenceDistribution`) e pontos do plano cartesiano (`buildCartesianPoints`) em `stem-erp/src/lib/risk-matrix.ts`
- [X] T008 [P] Implementar esquemas Zod (`createRiskItemSchema`, `updateRiskItemSchema`, `registerRiskReviewSchema`) com enums exatos (`QUASE_CERTO`, `PROVAVEL`, `POSSIVEL`, `IMPROVAVEL`, `RARA`, `NONE` e `CATASTROFICA`, `GRANDE`, `MODERADA`, `PEQUENA`, `DESPREZIVEL`, `NONE`) e limites de texto (`title` 3..160 chars, `notes` 3..1000 chars) em `stem-erp/src/lib/risk-schemas.ts`
- [X] T009 [P] Criar testes unitários de matriz 5×5, tratamento de `None`, percentuais e plano cartesiano em `stem-erp/src/__tests__/risk-matrix.test.ts`
- [X] T010 [P] Criar testes unitários dos esquemas Zod de risco e revisão em `stem-erp/src/__tests__/risk-schemas.test.ts`

**Checkpoint**: Base de dados, regras de cálculo e validações testadas e prontas.

---

## Phase 3: User Story 1 - Registrar e priorizar riscos e oportunidades com planos proativos e de contingência (Priority: P1) 🎯 MVP

**Goal**: Permitir cadastrar, editar e excluir riscos e oportunidades com setor, probabilidade, consequência, estratégia proativa, plano de contingência, observações e evidências, respeitando RBAC e isolamento por equipe/temporada.

**Independent Test**: Cadastrar um risco e uma oportunidade com diferentes níveis de chance/consequência, estratégia proativa, plano de contingência e evidência; confirmar persistência, cálculo de prioridade e bloqueio para `AUDITOR`.

### Implementation for User Story 1

- [X] T011 [US1] Implementar Server Actions `getRiskModuleData`, `createRiskItem`, `updateRiskItem` e `deleteRiskItem` com validação de sessão, `teamId`, `AUDITOR` read-only e `safeParse` em `stem-erp/src/actions/risk-actions.ts`
- [X] T012 [US1] Implementar hook `useRisks` gerenciando carregamento por temporada, filtros, estados (loading/error/empty/success) e mutações CRUD em `stem-erp/src/hooks/use-risks.ts`
- [X] T013 [P] [US1] Implementar modal `RiskFormDialog` com `react-hook-form` + `zodResolver`, alinhamento padrão de labels/inputs e campos de tipo (Risco/Oportunidade), setor, probabilidade, consequência, estratégia proativa, plano de contingência, observações e evidências em `stem-erp/src/components/risks/risk-form-dialog.tsx`
- [X] T014 [US1] Adicionar rota `/riscos` envolvida por `<DashboardShell>` com `title` e `subtitle` obrigatórios em `stem-erp/src/app/riscos/page.tsx`
- [X] T015 [US1] Adicionar link do módulo "Gestão de Riscos" (`/riscos`) na barra lateral fixa e menu mobile em `stem-erp/src/components/layout/app-sidebar.tsx`

**Checkpoint**: User Story 1 funcional — usuários autorizados já cadastram, editam e removem riscos/oportunidades em `/riscos`.

---

## Phase 4: User Story 2 - Analisar riscos em tabela detalhada, gráficos de pizza e plano cartesiano (Priority: P2)

**Goal**: Entregar os dois gráficos de pizza (`%` por Chance e `%` por Consequência), o gráfico em plano cartesiano com bolinhas e a tabela completa com as colunas **Setor**, **Probabilidade de ocorrer**, **Consequência de ocorrência**, **Risco** e **Observações**, com filtros e paginação padrão (10 itens).

**Independent Test**: Com múltiplos riscos e oportunidades cadastrados, validar que os dois gráficos de pizza somam 100%, o plano cartesiano posiciona as bolinhas nas coordenadas corretas e a tabela exibe as 5 colunas obrigatórias com menu de engrenagem e paginação de 10 itens.

### Implementation for User Story 2

- [X] T016 [P] [US2] Implementar componente `RiskDistributionCharts` com dois gráficos de pizza (`Recharts` `PieChart`) exibindo `%` por Chance e `%` por Consequência usando apenas tokens semânticos em `stem-erp/src/components/risks/risk-distribution-charts.tsx`
- [X] T017 [P] [US2] Implementar componente `RiskCartesianChart` (`Recharts` `ScatterChart`) posicionando riscos e oportunidades em bolinhas por Probabilidade × Consequência, tratando `None`, sobreposições e tooltip interativo em `stem-erp/src/components/risks/risk-cartesian-chart.tsx`
- [X] T018 [P] [US2] Implementar componente `RiskTable` (`@tanstack/react-table`) com colunas obrigatórias (`Setor`, `Probabilidade de ocorrer`, `Consequência de ocorrência`, `Risco`, `Observações`), `pageSize: 10` fixo, rodapé de 4 botões e coluna de ações com botão de engrenagem (`Settings` + `DropdownMenu`) em `stem-erp/src/components/risks/risk-table.tsx`
- [X] T019 [US2] Integrar filtros (setor, tipo, probabilidade, consequência, status, busca), gráficos de pizza, plano cartesiano, tabela e tratamento completo dos 4 estados de UI (`Skeleton`, Error + retry, Empty State, Success) em `stem-erp/src/components/risks/risks-view.tsx`

**Checkpoint**: User Stories 1 e 2 funcionais — painel analítico completo e tabela padronizada operacionais.

---

## Phase 5: User Story 3 - Realizar revisões e atualizações regulares ao longo do ciclo de vida (Priority: P3)

**Goal**: Permitir registrar revisões periódicas nos riscos e oportunidades existentes, atualizando probabilidade, consequência, status e evidências com preservação de histórico cronológico.

**Independent Test**: Selecionar um risco pelo menu de engrenagem, registrar uma revisão reduzindo probabilidade/alterando status e incluindo evidência; confirmar atualização nos gráficos/tabela e exibição do histórico cronológico.

### Implementation for User Story 3

- [X] T020 [US3] Implementar Server Actions `registerRiskReview` (transação `prisma.$transaction` criando `RiskReview` e atualizando `RiskItem`) e `getRiskReviews` em `stem-erp/src/actions/risk-actions.ts`
- [X] T021 [US3] Estender `useRisks` para carregar histórico de revisões e executar `registerRiskReview` com atualização otimista/reativa em `stem-erp/src/hooks/use-risks.ts`
- [X] T022 [P] [US3] Implementar modal `RiskReviewDialog` com formulário de nova revisão (nova probabilidade, nova consequência, novo status, notas, evidência) e linha do tempo cronológica de revisões anteriores em `stem-erp/src/components/risks/risk-review-dialog.tsx`
- [X] T023 [US3] Conectar ação "Registrar revisão / Histórico" no menu de engrenagem de `RiskTable` e no `RisksView` em `stem-erp/src/components/risks/risk-table.tsx` e `stem-erp/src/components/risks/risks-view.tsx`

**Checkpoint**: Todas as histórias de usuário (`US1`, `US2`, `US3`) integradas e independentemente testáveis.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cobertura de testes de componente e E2E, validação de qualidade, acessibilidade, responsividade e sincronização Git.

- [X] T024 [P] Criar testes de componente (`@testing-library/react`) cobrindo os 4 estados de UI (Loading, Error, Empty, Success), abertura de modais e submissão de formulário em `stem-erp/src/__tests__/risks-view.test.tsx`
- [X] T025 [P] Criar teste E2E Playwright cobrindo cadastro de risco/oportunidade, gráficos de pizza, plano cartesiano, tabela e registro de revisão em viewports desktop (`1280×720`) e mobile (`375×667`) em `stem-erp/e2e/risks.spec.ts`
- [X] T026 Executar validações completas (`npx tsc --noEmit`, `npm run lint`, `npm test`) em `stem-erp/` e corrigir eventuais apontamentos
- [X] T027 Validar fluxo completo conforme `specs/007-gestao-de-riscos/quickstart.md` e realizar commit, `git pull`, `git push` e abertura/atualização do Pull Request para `main`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: Inicia imediatamente.
- **Foundational (Phase 2)**: Depende da Phase 1; bloqueia todas as User Stories.
- **User Story 1 (Phase 3 - MVP)**: Depende da Phase 2.
- **User Story 2 (Phase 4)**: Depende da Phase 2 e integra com `useRisks` / `/riscos` entregues na Phase 3.
- **User Story 3 (Phase 5)**: Depende da Phase 3 (ações e hook base) e Phase 4 (gatilho no menu de engrenagem da tabela).
- **Polish (Phase 6)**: Depende da conclusão das Phases 3, 4 e 5.

### Parallel Opportunities
- **Phase 1**: `T002` e `T003` em paralelo após `T001`.
- **Phase 2**: `T007`, `T008`, `T009`, `T010` em paralelo após `T005`/`T006`.
- **Phase 4**: `T016`, `T017`, `T018` em paralelo antes de consolidar `T019`.
- **Phase 6**: `T024` e `T025` em paralelo antes de `T026`.

---

## Implementation Strategy

### MVP First (User Story 1)
1. Concluir Phase 1 + Phase 2.
2. Concluir Phase 3 (`US1`) para habilitar o registro e priorização de riscos/oportunidades em `/riscos`.
3. Validar criação, edição, exclusão e bloqueio de `AUDITOR`.

### Incremental Delivery
1. Entregar `US2` (gráficos de pizza, plano cartesiano e tabela padronizada).
2. Entregar `US3` (revisões periódicas e histórico cronológico).
3. Finalizar com Phase 6 (testes de componente, E2E, lint, typecheck e PR).
