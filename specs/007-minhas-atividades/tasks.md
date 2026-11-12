# Tasks: Painel de Minhas Atividades e KPIs de Desempenho Individual

**Input**: Design documents from `/specs/007-minhas-atividades/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Conforme o Princípio IV da Constituição do Genesis Gestão, testes automatizados (unitários, integração, componentes e E2E) são obrigatórios para todas as histórias de usuário.

**Organization**: Tarefas organizadas por história de usuário para permitir implementação e validação incremental independente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode ser executada em paralelo (arquivos distintos, sem dependências de tarefas incompletas)
- **[Story]**: História de usuário associada (`[US1]`, `[US2]`, `[US3]`)
- Caminhos exatos de arquivos incluídos em todas as descrições

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparação segura do banco de dados e atualização do schema Prisma conforme Guardrails (Regra 12)

- [X]  Executar backup preventivo do banco de dados (`npm run db:backup`) em `stem-erp/` antes de alterar o schema
- [X]  Estender o enum `TaskStatus` com `CANCELLED` e adicionar `completedAt DateTime?` e `cancelledAt DateTime?` ao model `Task` em `stem-erp/prisma/schema.prisma`
- [X]  Aplicar migração segura no banco (`npm run db:safe-push`) e atualizar cliente Prisma (`npx prisma generate`) em `stem-erp/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tipos de domínio, schemas Zod, navegação e extensão do workspace necessários para todas as histórias

**⚠️ CRITICAL**: Nenhuma história de usuário pode iniciar antes da conclusão desta fase

- [X]  [P] Estender `TaskWorkspace` (com `currentUserId: string`), `TaskRecord` (com `completedAt: string | null`, `cancelledAt: string | null`) e `TASK_STATUS_LABELS` (com `CANCELLED: "Cancelada"`) em `stem-erp/src/types/tasks.ts`
- [X]  [P] Atualizar `TaskStatus` nos schemas existentes e criar `updateMyTaskStatusSchema` (`teamId`, `taskId`, `status: TODO | IN_PROGRESS | DONE | CANCELLED`, `revision >= 0`) em `stem-erp/src/lib/validations/tasks.ts`
- [X]  [P] Adicionar a entrada `my-activities` ("Minhas atividades", `href: "/tarefas?tab=my-activities"`, título e subtítulo contextuais) em `TASK_VIEWS` em `stem-erp/src/lib/task-navigation.ts`
- [X]  [P] Registrar ícone e link de navegação para `"my-activities"` em `TaskNavGroup` em `stem-erp/src/components/layout/task-nav-group.tsx`
- [X]  Atualizar `getTaskWorkspace` em `stem-erp/src/services/task-service.ts` para retornar `currentUserId: scope.actorId` e serializar `completedAt` e `cancelledAt` em ISO-8601 (`string | null`)

**Checkpoint**: Fundação pronta — histórias de usuário podem ser implementadas em ordem de prioridade ou paralelo.

---

## Phase 3: User Story 1 - Visualização e Acompanhamento por Prazo Limite (Priority: P1) 🎯 MVP

**Goal**: Exibir todas as atividades atribuídas ao usuário autenticado ordenadas por urgência de prazo limite, com contagem regressiva, filtros temporais/busca e paginação padrão de 10 itens.

**Independent Test**: Acessar `/tarefas?tab=my-activities` com usuário que possui tarefas atrasadas, vencendo hoje e futuras, e confirmar filtragem automática do usuário, ordenação por prazo limite, contagem regressiva e paginação de 10 itens.

### Tests for User Story 1

- [X]  [P] [US1] Criar testes unitários para filtragem de atribuição (`R`), classificação de urgência (`OVERDUE`, `DUE_TODAY`, `DUE_SOON`, `ON_TRACK`, `COMPLETED`, `CANCELLED`), cálculo de dias restantes e ordenação cronológica em `stem-erp/src/lib/__tests__/my-activities.test.ts`

### Implementation for User Story 1

- [X]  [P] [US1] Implementar funções puras `buildMyActivityItems`, `classifyDeadlineUrgency`, `formatDeadlineCountdown` e `filterAndSortMyActivities` em `stem-erp/src/lib/my-activities.ts`
- [X]  [US1] Implementar custom hook `useMyActivities` com estado de busca textual, filtro de status (`ALL | TODO | IN_PROGRESS | DONE | CANCELLED`), filtro de prazo (`ALL | OVERDUE | THIS_WEEK | NEXT_15_DAYS`) e paginação fixa em `pageSize: 10` em `stem-erp/src/components/tasks/use-my-activities.ts`
- [X]  [US1] Implementar `MyActivitiesView` com `tv()` fora do componente, tokens semânticos, lista/tabela responsiva por prazo limite, 4 estados de UI (`Skeleton`, erro com retry, empty state e sucesso) e paginação padrão (4 botões) em `stem-erp/src/components/tasks/my-activities-view.tsx`
- [X]  [US1] Integrar `MyActivitiesView` na renderização de abas de `TasksView` quando `viewId === "my-activities"` em `stem-erp/src/components/tasks/tasks-view.tsx`
- [X]  [P] [US1] Criar testes de componente validando ordenação por prazo, filtros, paginação fixa (10/pág) e estados de UI em `stem-erp/src/components/tasks/__tests__/my-activities-view.test.tsx`

**Checkpoint**: User Story 1 funcional e testável de forma independente como MVP.

---

## Phase 4: User Story 2 - Transição e Atualização de Status da Atividade (Priority: P2)

**Goal**: Permitir que o executor altere o status da atividade diretamente na tela (`A fazer`, `Em andamento`, `Concluída`, `Cancelada`) com persistência segura, controle de `revision` e bloqueio de escrita para `AUDITOR`.

**Independent Test**: Alterar o status de uma tarefa para `Concluída` e outra para `Cancelada`, recarregar a página e confirmar persistência no banco e desabilitação dos controles para usuários `AUDITOR`.

### Tests for User Story 2

- [X]  [P] [US2] Adicionar testes unitários de validação Zod para `updateMyTaskStatusSchema` em `stem-erp/src/lib/validations/__tests__/tasks.test.ts`
- [X]  [P] [US2] Adicionar testes de integração para `updateTaskStatus` (transição `DONE`/`CANCELLED`/`TODO`, timestamps `completedAt`/`cancelledAt`, conflito de `revision` e bloqueio de `AUDITOR`) em `stem-erp/src/services/__tests__/task-service.integration.test.ts`

### Implementation for User Story 2

- [X]  [US2] Implementar método transacional `updateTaskStatus` em `stem-erp/src/services/task-service.ts` aplicando a matriz de transição de `completedAt`/`cancelledAt` e verificação otimista de `revision`
- [X]  [US2] Implementar Server Action `updateMyTaskStatusAction` com validação Zod e `revalidatePath("/tarefas")` em `stem-erp/src/actions/tasks.actions.ts`
- [X]  [US2] Adicionar handler `handleStatusChange` com estado de carregamento por linha e feedback via `sonner` no hook `useMyActivities` em `stem-erp/src/components/tasks/use-my-activities.ts`
- [X]  [US2] Adicionar seletor de status acessível na linha e menu de engrenagem (`Settings` + `DropdownMenu`) com opções de status e `Ver detalhes` em `stem-erp/src/components/tasks/my-activities-view.tsx`
- [X]  [P] [US2] Expandir testes de componente em `stem-erp/src/components/tasks/__tests__/my-activities-view.test.tsx` para cobrir transição de status e modo somente leitura (`canEdit: false`)

**Checkpoint**: User Stories 1 e 2 funcionam de forma integrada e independente.

---

## Phase 5: User Story 3 - KPIs de Desempenho e Produtividade Individual (Priority: P3)

**Goal**: Exibir indicadores consolidados de desempenho individual no topo da tela (Total Atribuído, Concluídas, Pendentes, Em Atraso e Taxa de Pontualidade) atualizados reativamente.

**Independent Test**: Fornecer conjunto conhecido de tarefas (concluídas no prazo, concluídas com atraso, pendentes e canceladas) e verificar exatidão aritmética dos 5 cards de KPI e recálculo imediato após alteração de status.

### Tests for User Story 3

- [X]  [P] [US3] Adicionar testes unitários para `calculateUserActivityKpis` (cenário misto, divisão por zero sem concluídas, exclusão de canceladas da taxa de conclusão e tarefas legadas sem `completedAt`) em `stem-erp/src/lib/__tests__/my-activities.test.ts`

### Implementation for User Story 3

- [X]  [US3] Implementar função pura `calculateUserActivityKpis` em `stem-erp/src/lib/my-activities.ts`
- [X]  [US3] Expor objeto `kpis` calculado reativamente em `useMyActivities` em `stem-erp/src/components/tasks/use-my-activities.ts`
- [X]  [P] [US3] Criar componente `MyActivitiesKpis` com `tv()` fora do componente, tokens semânticos e grid responsiva mobile-first (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`) em `stem-erp/src/components/tasks/my-activities-kpis.tsx`
- [X]  [US3] Integrar `MyActivitiesKpis` no topo de `MyActivitiesView` em `stem-erp/src/components/tasks/my-activities-view.tsx`
- [X]  [P] [US3] Adicionar testes de componente validando renderização dos KPIs (valores numéricos, percentuais e estado zerado) em `stem-erp/src/components/tasks/__tests__/my-activities-view.test.tsx`

**Checkpoint**: Todas as histórias de usuário (US1, US2 e US3) implementadas e validadas.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Garantia de retrocompatibilidade, E2E, quality gates e sincronização Git obrigatória

- [X]  [P] Verificar e ajustar visões existentes (`task-list.tsx`, `task-gantt.tsx`, `task-raci.tsx`, `task-form.tsx`) para suportar exibição/badge do novo status `CANCELLED` sem regressões em `stem-erp/src/components/tasks/`
- [X]  [P] Criar teste E2E cobrindo navegação pela sidebar, ordenação por prazo, transição de status, atualização de KPIs e viewport mobile (`375x667`) em `stem-erp/e2e/my-activities.spec.ts`
- [X]  Executar validações completas (`npx tsc --noEmit`, `npm run lint`, `npm test`) e cenários do `quickstart.md` em `stem-erp/`
- [X] T031 Executar `git pull`, commit convencional, `git push` e abrir/atualizar Pull Request para `main` (Regra 10 da Constituição)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — iniciar imediatamente.
- **Foundational (Phase 2)**: Depende de Phase 1 — **BLOQUEIA** todas as histórias de usuário.
- **User Story 1 (Phase 3)**: Depende de Phase 2.
- **User Story 2 (Phase 4)**: Depende de Phase 2 e integra-se na tabela/hook criados em US1 (`T011`, `T012`).
- **User Story 3 (Phase 5)**: Depende de Phase 2 e integra-se na visão/hook criados em US1 (`T011`, `T012`).
- **Polish (Phase 6)**: Depende da conclusão de US1, US2 e US3.

### Parallel Opportunities

- **Phase 2**: `T004`, `T005`, `T006` e `T007` atuam em arquivos distintos e podem ser executadas em paralelo.
- **US1**: `T009` e `T010` em paralelo; `T014` em paralelo após `T012`.
- **US2**: `T015` e `T016` em paralelo antes da implementação de `T017`.
- **US3**: `T022` e `T025` em paralelo enquanto `T023`/`T024` são implementadas.
- **Polish**: `T028` e `T029` em paralelo antes da validação final (`T030`).

---

## Parallel Example: Foundational & US1

```bash
# Phase 2 em paralelo:
T004: "Estender tipos em stem-erp/src/types/tasks.ts"
T005: "Criar updateMyTaskStatusSchema em stem-erp/src/lib/validations/tasks.ts"
T006: "Adicionar my-activities em stem-erp/src/lib/task-navigation.ts"
T007: "Registrar item na sidebar em stem-erp/src/components/layout/task-nav-group.tsx"

# US1 em paralelo (Testes + Lógica Pura):
T009: "Testes unitários em stem-erp/src/lib/__tests__/my-activities.test.ts"
T010: "Funções puras de prazos e ordenação em stem-erp/src/lib/my-activities.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Concluir Phase 1 (Setup + Backup/Safe-Push do Banco)
2. Concluir Phase 2 (Foundational)
3. Concluir Phase 3 (US1 — Visualização e Ordenação por Prazo Limite)
4. **Validar MVP**: Confirmar ordenação por urgência, filtros e paginação de 10 itens.

### Incremental Delivery

1. Setup + Foundational → Base pronta.
2. US1 → Listagem priorizada por prazo limite (MVP).
3. US2 → Transição rápida de status (`A fazer`, `Em andamento`, `Concluída`, `Cancelada`).
4. US3 → Bloco de KPIs de desempenho individual.
5. Polish → Retrocompatibilidade `CANCELLED`, E2E, quality gates e PR.
