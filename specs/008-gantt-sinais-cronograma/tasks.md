---
description: "Task list for Sinais de Status, Linha de Base e Caminho Crítico no Gantt"
---

# Tasks: Sinais de Status, Linha de Base e Caminho Crítico no Gantt

**Input**: Design documents from `/specs/008-gantt-sinais-cronograma/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/gantt-signals.md](contracts/gantt-signals.md), [quickstart.md](quickstart.md)

**Tests**: Obrigatórios pela Constituição do projeto (Princípio IV). Incluem testes unitários de domínio (`tsx --test`), validação Zod, testes de componentes (Testing Library) e fluxo E2E (Playwright desktop + mobile).

**Organization**: Tarefas organizadas por User Story em ordem de prioridade (P1 → P2 → P3), permitindo entrega incremental e validação independente de cada fatia.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos distintos, sem dependência de tarefa incompleta)
- **[Story]**: User Story correspondente (`[US1]`, `[US2]`, `[US4]`, `[US3]`)
- Caminhos exatos relativos à raiz do repositório (`stem-erp/...`)

---

## Phase 1: Setup (Proteção de Banco e Schema Aditivo)

**Purpose**: Garantir snapshot seguro do banco (Regra 12 — Zero Reset) e aplicar as 4 colunas aditivas no modelo `Task`.

- [X] T001 Executar backup pré-migração obrigatório via `npm run db:backup` em `stem-erp/` e confirmar geração de `stem-erp/prisma/backups/latest-snapshot.json`
- [X] T002 Adicionar os campos aditivos `baselineStartDate DateTime? @db.Date`, `baselineEndDate DateTime? @db.Date`, `isAtRisk Boolean @default(false)` e `isCritical Boolean @default(false)` no `model Task` em `stem-erp/prisma/schema.prisma`
- [X] T003 Aplicar a sincronização segura do schema via `npm run db:safe-push` e regenerar o Prisma Client (`npx prisma generate`) em `stem-erp/`

---

## Phase 2: Foundational (Tipos, Validação Zod, Serviço e Server Actions)

**Purpose**: Camada de contrato e persistência compartilhada por todas as User Stories.

**⚠️ CRITICAL**: Nenhuma User Story de UI deve iniciar antes da conclusão desta fase.

- [X] T004 [P] Estender `TaskRecord` com `baselineStartDate: string`, `baselineEndDate: string`, `isAtRisk: boolean` e `isCritical: boolean` em `stem-erp/src/types/tasks.ts`
- [X] T005 [P] Escrever testes unitários de validação Zod cobrindo `baselineStartDate <= baselineEndDate`, `startDate <= endDate`, `isAtRisk` e `isCritical` em `stem-erp/src/lib/validations/__tests__/tasks-validation.test.ts`
- [X] T006 Estender `createTaskSchema` (adicionando `isAtRisk` e `isCritical` opcionais com padrão `false`) e `editTaskSchema` (adicionando `baselineStartDate` e `baselineEndDate` opcionais com refine `baselineStartDate <= baselineEndDate`, mantendo `startDate <= endDate`) em `stem-erp/src/lib/validations/tasks.ts`
- [X] T007 Atualizar `createTask` (gravando `baselineStartDate = startDate` e `baselineEndDate = endDate` automaticamente), `editTask` (atualizando datas, baseline opcional e flags `isAtRisk`/`isCritical` com controle otimista de `revision`), `rescheduleTask` (preservando `baselineStartDate`/`baselineEndDate` e gravando fallback em tarefas legadas) e a projeção de leitura (fallback `baselineStartDate ?? startDate` e `baselineEndDate ?? endDate`) em `stem-erp/src/services/task-service.ts`
- [X] T008 Atualizar repasse tipado dos novos campos em `createTaskAction` e `editTaskAction` preservando bloqueio de perfil `AUDITOR` e isolamento por `teamId` em `stem-erp/src/actions/tasks.actions.ts`

**Checkpoint**: Persistência aditiva, validação Zod e Server Actions prontas e testadas — as User Stories podem ser implementadas.

---

## Phase 3: User Story 1 - Comparar linha de base planejada com execução no Gantt (Priority: P1) 🎯 MVP

**Goal**: Exibir coluna `ID | Atividade` com identificador curto (`A..Z, AA..`), renderizar a barra cinza de linha de base (planejado) pareada à barra de execução atual no Gantt e permitir editar linha de base e datas atuais no formulário de tarefas.

**Independent Test**: Cadastrar uma tarefa, reprogramá-la (no formulário ou arrastando no Gantt), abrir o Gantt e confirmar ID curto sequencial (`A`, `B`...), nome da atividade, barra cinza de linha de base preservada e barra de execução refletindo as novas datas.

### Tests for User Story 1

- [X] T009 [P] [US1] Criar testes unitários para geração determinística de IDs curtos (`A..Z`, `AA`, `AB`) e cálculo de desvio por tarefa em `stem-erp/src/lib/__tests__/task-gantt-metrics.test.ts`

### Implementation for User Story 1

- [X] T010 [P] [US1] Implementar `formatTaskShortId(index)` e estrutura base de projeção de métricas por tarefa em `stem-erp/src/lib/task-gantt-metrics.ts`
- [X] T011 [US1] Atualizar o formulário de criação/edição com bloco de Linha de Base (editável na edição, automático na criação) e toggles `Risco de atraso (Atenção)` e `Atividade crítica` com alinhamento nivelado de labels (`min-h-[2rem] flex items-end`) conforme Regra 13 em `stem-erp/src/components/tasks/task-form.tsx`
- [X] T012 [US1] Reestruturar a coluna esquerda do Gantt para exibir `ID` curto + `Atividade` e renderizar a barra cinza de linha de base (`baselineStartDate..baselineEndDate`) pareada à barra de execução (`startDate..endDate`) em `stem-erp/src/components/tasks/task-gantt.tsx`

**Checkpoint**: MVP funcional — tarefas gravam e preservam linha de base, e o Gantt exibe ID curto, atividade e comparação visual planejado vs. atual.

---

## Phase 4: User Story 2 - Ler sinais semafóricos de prazo, conclusão e legenda no Gantt (Priority: P2)

**Goal**: Classificar cada tarefa em `Em dia` (verde), `Atenção` (amarelo), `Atrasada` (vermelho) ou `Concluída` (verde escuro + ícone ✓), exibir rótulo textual junto às barras e renderizar o painel `Legenda (status)` com os 5 sinais.

**Independent Test**: Criar 4 tarefas cobrindo `Em dia`, `Atenção`, `Atrasada` e `Concluída`, abrir o Gantt e verificar cores semânticas, rótulos textuais ao lado das barras, ícone ✓ na concluída e os 5 itens na legenda.

### Tests for User Story 2

- [X] T013 [P] [US2] Adicionar testes unitários para `evaluateTaskScheduleSignal` cobrindo precedência (`CANCELLED` > `COMPLETED` > `DELAYED` > `AT_RISK` por ≤ 2 dias, ≥ 80% decorrido e `isAtRisk` manual > `ON_TRACK`) em `stem-erp/src/lib/__tests__/task-gantt-metrics.test.ts`
- [X] T014 [P] [US2] Criar testes de componente validando cores semânticas, rótulos textuais (`Em dia`, `Atenção`, `Atrasada`, `Concluída`), ícone ✓ e os 5 itens da `Legenda (status)` em `stem-erp/src/components/tasks/__tests__/task-gantt-signals.test.tsx`

### Implementation for User Story 2

- [X] T015 [P] [US2] Implementar `evaluateTaskScheduleSignal(task, todayIso)` e mapa de rótulos semânticos em `stem-erp/src/lib/task-gantt-metrics.ts`
- [X] T016 [P] [US2] Criar componente `TaskGanttLegend` com `tailwind-variants` (`tv`) e tokens semânticos exibindo os 5 itens da legenda (`Verde`, `Amarelo`, `Vermelho`, `Cinza`, `Losango vermelho`) em `stem-erp/src/components/tasks/task-gantt-legend.tsx`
- [X] T017 [US2] Integrar variantes semânticas de barra (`ON_TRACK`, `AT_RISK`, `DELAYED`, `COMPLETED`), selo de verificação ✓ em tarefas concluídas, rótulo textual ao lado da barra e o painel `TaskGanttLegend` em `stem-erp/src/components/tasks/task-gantt.tsx`

**Checkpoint**: Semáforo de prazo, estado concluído com check e legenda completa operando com acessibilidade além da cor.

---

## Phase 5: User Story 4 - Acompanhar indicadores executivos do cronograma nos cards do Gantt (Priority: P2)

**Goal**: Exibir os 4 cards executivos no topo da página do Gantt (`Progresso geral` com barra percentual, `Atividades críticas`, `Desvio atual` em dias e `Marco final`), reativos ao filtro de setor e edições de tarefas.

**Independent Test**: Abrir o Gantt com tarefas mistas e validar que os 4 cards exibem valores exatos (incluindo `progressbar` acessível), atualizam ao editar/concluir tarefas e respondem ao filtro de setor e ao estado vazio.

### Tests for User Story 4

- [X] T018 [P] [US4] Adicionar testes unitários para `computeGanttSummary` cobrindo `progressPercent`, `criticalCount`, `deviationDays` (`+N`, `0`, `-N`), `milestoneStatus` (`No prazo`, `Sob atenção`, `Em atraso`, `Concluído`, `Sem atividades`) e exclusão de tarefas `CANCELLED` em `stem-erp/src/lib/__tests__/task-gantt-metrics.test.ts`
- [X] T019 [P] [US4] Adicionar testes de componente para `TaskGanttKpis` validando os 4 cards, `role="progressbar"` com `aria-valuenow` e estados positivos/negativos/vazios em `stem-erp/src/components/tasks/__tests__/task-gantt-signals.test.tsx`

### Implementation for User Story 4

- [X] T020 [P] [US4] Implementar `computeGanttSummary(tasks, edges, todayIso)` em `stem-erp/src/lib/task-gantt-metrics.ts`
- [X] T021 [P] [US4] Criar componente responsivo `TaskGanttKpis` (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`) usando `tailwind-variants` (`tv`) e tokens semânticos em `stem-erp/src/components/tasks/task-gantt-kpis.tsx`
- [X] T022 [US4] Renderizar `TaskGanttKpis` no topo da visão Gantt alimentado pelas tarefas visíveis (respeitando filtro de setor e datas otimistas) em `stem-erp/src/components/tasks/task-gantt.tsx`

**Checkpoint**: Os 4 cards executivos sintetizam a saúde do cronograma em tempo real no topo do Gantt.

---

## Phase 6: User Story 3 - Identificar e destacar atividades do Caminho Crítico (Priority: P3)

**Goal**: Calcular o Caminho Crítico combinando CPM automático (folga zero via datas + dependências) com marcação manual `isCritical`, destacando a linha inteira com contorno vermelho, marcador losango vermelho (`◇`) no fim da barra e rótulo `"Crítica"`.

**Independent Test**: Configurar uma cadeia de dependências com folga e uma atividade sem folga (ou marcada manualmente como crítica), abrir o Gantt e confirmar contorno vermelho na linha completa, losango `◇`, rótulo `"Crítica"` e contagem atualizada no card `Atividades críticas`.

### Tests for User Story 3

- [X] T023 [P] [US3] Adicionar testes unitários para `computeCriticalPathIds` cobrindo cadeia simples, ramificação paralela com folga, múltiplas entregas empatadas no prazo final, exclusão de canceladas e soma com `isCritical` manual em `stem-erp/src/lib/__tests__/task-gantt-metrics.test.ts`
- [X] T024 [P] [US3] Adicionar testes de componente validando destaque de linha crítica, marcador losango `◇`, rótulo `"Crítica"` e convivência sem sobreposição com barra amarela/vermelha em `stem-erp/src/components/tasks/__tests__/task-gantt-signals.test.tsx`

### Implementation for User Story 3

- [X] T025 [US3] Implementar algoritmo CPM (Forward/Backward Pass com folga zero + override manual `isCritical`) em `computeCriticalPathIds` dentro de `stem-erp/src/lib/task-gantt-metrics.ts`
- [X] T026 [US3] Aplicar destaque visual de caminho crítico na linha completa (contorno `border-destructive`), marcador losango vermelho (`◇`) na extremidade final da barra e rótulo `"Crítica"` sem sobrepor o status da barra em `stem-erp/src/components/tasks/task-gantt.tsx`
- [X] T027 [US3] Exibir resumo de linha de base, status do prazo e indicador de caminho crítico no painel de detalhes da tarefa em `stem-erp/src/components/tasks/task-detail.tsx`

**Checkpoint**: Todas as 4 User Stories integradas e testáveis de forma independente.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validação ponta a ponta (desktop + mobile), auditoria de Design System/acessibilidade, quality gates e sincronização remota obrigatória (Regra 10).

- [X] T028 [P] Criar teste E2E cobrindo criação de tarefa, reprogramação com desvio, sinais semafóricos, caminho crítico, 4 cards e legenda em desktop (`1280x720`) e mobile (`375x667`) em `stem-erp/e2e/tarefas-gantt-sinais.spec.ts`
- [X] T029 Revisar todos os arquivos alterados garantindo zero cores hardcoded/hex, zero `any`, alinhamento nivelado de labels (Regra 13) e ausência de banners didáticos redundantes (Regra 14) em `stem-erp/src/components/tasks/`
- [X] T030 Executar quality gates obrigatórios em `stem-erp/`: `npx tsc --noEmit`, `npm run lint` e `npm test` garantindo 100% de aprovação
- [X] T031 Executar `git pull`, efetuar commit semântico (`feat(gantt): ...`), `git push origin <branch>` e abrir/atualizar Pull Request para `main` conforme Regra 10

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependências — inicia imediatamente (backup obrigatório antes do schema).
- **Phase 2 (Foundational)**: Depende de Phase 1 — BLOQUEIA todas as User Stories.
- **Phase 3 (US1 — P1 🎯 MVP)**: Depende de Phase 2.
- **Phase 4 (US2 — P2)**: Depende de Phase 2 (e integra visualmente com `task-gantt.tsx` de US1).
- **Phase 5 (US4 — P2)**: Depende de Phase 2 (consome `evaluateTaskScheduleSignal` de US2 e `computeCriticalPathIds` de US3 para contagem final, podendo ser desenvolvida em paralelo com stubs e integrada em `task-gantt.tsx`).
- **Phase 6 (US3 — P3)**: Depende de Phase 2 (integra destaque visual em `task-gantt.tsx` e `task-detail.tsx`).
- **Phase 7 (Polish)**: Depende da conclusão das Phases 3–6.

### Parallel Opportunities

- **Phase 2**: `T004` (`types/tasks.ts`) e `T005` (`tasks-validation.test.ts`) podem rodar em paralelo.
- **Phase 3 (US1)**: `T009` (testes) e `T010` (`formatTaskShortId`) podem rodar em paralelo com a preparação de `T011` (`task-form.tsx`).
- **Phase 4 (US2)**: `T013`, `T014`, `T015` e `T016` (`task-gantt-legend.tsx`) atuam em arquivos distintos e podem rodar em paralelo antes da integração em `T017`.
- **Phase 5 (US4)**: `T018`, `T019`, `T020` e `T021` (`task-gantt-kpis.tsx`) podem rodar em paralelo antes de `T022`.
- **Phase 6 (US3)**: `T023` e `T024` podem rodar em paralelo antes de `T025`–`T027`.

---

## Parallel Example: User Story 2

```bash
# Executar em paralelo (arquivos distintos):
Task T015: Implementar evaluateTaskScheduleSignal em stem-erp/src/lib/task-gantt-metrics.ts
Task T016: Criar TaskGanttLegend em stem-erp/src/components/tasks/task-gantt-legend.tsx
Task T014: Criar testes de componente em stem-erp/src/components/tasks/__tests__/task-gantt-signals.test.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Concluir Phase 1 (Backup + Schema aditivo via `db:safe-push`).
2. Concluir Phase 2 (Tipos, Zod, Service e Actions).
3. Concluir Phase 3 (US1: ID curto, coluna `ID | Atividade`, barra cinza de linha de base e edição no `TaskForm`).
4. **Validar MVP**: Criar tarefa, reprogramar e confirmar comparação visual planejado vs. atual no Gantt.

### Incremental Delivery

1. **MVP (US1)** → Linha de base + ID curto + formulário atualizado.
2. **Incremento 2 (US2)** → Semáforo de status (`Em dia`, `Atenção`, `Atrasada`, `Concluída` com ✓) + `Legenda (status)`.
3. **Incremento 3 (US4)** → 4 Cards executivos no topo (`Progresso geral`, `Atividades críticas`, `Desvio atual`, `Marco final`).
4. **Incremento 4 (US3)** → Caminho Crítico (CPM + flag manual, contorno vermelho, losango `◇`, rótulo `"Crítica"`).
5. **Polish** → E2E desktop/mobile, quality gates (`tsc`, `lint`, `test`) e PR para `main`.
