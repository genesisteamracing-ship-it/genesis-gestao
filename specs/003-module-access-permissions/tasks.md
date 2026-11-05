---
description: "Task list for Gerenciamento de Permissões de Acesso por Usuário e Módulo"
---

# Tasks: Gerenciamento de Permissões de Acesso por Usuário e Módulo

**Input**: Design documents from `/specs/003-module-access-permissions/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/permissions-contracts.md`

**Tests**: Incluídos conforme exigência do Princípio IV da Constituição e Regra 7 do `AGENTS.md`.

**Organization**: Tarefas agrupadas por User Story para permitir implementação e validação independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode ser executada em paralelo (arquivos independentes)
- **[Story]**: User Story associada (`[US1]`, `[US2]`, `[US3]`)
- Caminhos exatos relativos à raiz do repositório (`stem-erp/...`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Evolução do schema Prisma e definição das interfaces e tipos base de permissões por módulo.

- [ ] T001 Add boolean permission fields `canAccessFinance Boolean @default(true)`, `canAccessRoi Boolean @default(true)`, `canAccessCommunication Boolean @default(true)`, and `canAccessTeam Boolean @default(false)` to the `User` model in `stem-erp/prisma/schema.prisma` and regenerate Prisma Client
- [ ] T002 [P] Define `SystemModuleKey` (`"finance" | "roi" | "communication" | "team"`) and `UserModulePermissionsDTO` (`finance: boolean`, `roi: boolean`, `communication: boolean`, `team: boolean`), extending `AuthenticatedUserDTO` and `TeamMemberDTO` with `permissions: UserModulePermissionsDTO` in `stem-erp/src/types/auth.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Utilitários puros de domínio, schemas Zod e camada de serviços/actions que sustentam todas as User Stories.

**⚠️ CRITICAL**: Nenhuma User Story de interface pode ser iniciada antes da conclusão desta fase.

- [ ] T003 [P] Create pure permission utilities (`SYSTEM_MODULES_META`, `getDefaultModulePermissionsByRole`, `canModifyUserModulePermission`, `getFirstAllowedRoute`, `hasModuleAccess`) in `stem-erp/src/lib/permissions.ts`
- [ ] T004 [P] Add Zod schemas `systemModuleKeySchema` (`z.enum(["finance", "roi", "communication", "team"])`), `toggleUserModulePermissionSchema` (`userId: z.string().min(1)`, `moduleKey`, `allowed: z.boolean()`), and `updateAllUserPermissionsSchema` in `stem-erp/src/lib/validations/auth.ts`
- [ ] T005 Update `getCurrentUserFromSession`, `getTeamManagementMetricsService`, `createTeamMemberService`, and add `toggleUserModulePermissionService`, `updateAllUserPermissionsService`, and `requireModuleAccess` in `stem-erp/src/services/auth-service.ts`
- [ ] T006 Expose Server Actions `toggleUserModulePermissionAction` and `updateAllUserPermissionsAction` with Zod validation, audit log creation, and path revalidation (`/permissoes`, `/equipe`, `/`) in `stem-erp/src/actions/auth-actions.ts`

**Checkpoint**: Fundação pronta — serviços, tipos, banco e Server Actions operacionais.

---

## Phase 3: User Story 1 - Configuração de Permissões por Usuário e Módulo via Toggle SIM/NÃO (Priority: P1) 🎯 MVP

**Goal**: Disponibilizar a tela dedicada `/permissoes` com listagem de usuários, busca/filtros e botões alternadores (*toggle buttons*) **`SIM` / `NÃO`** para cada módulo (**Financeiro**, **ROI & Patrocínio**, **Comunicação**, **Equipe & Acessos**), além do menu de engrenagem para ações rápidas por linha.

**Independent Test**: Acessar `/permissoes`, localizar um integrante e clicar no botão toggle do módulo "Financeiro" para alternar entre `SIM` e `NÃO`, verificando o feedback visual imediato e a persistência ao recarregar a página.

### Tests for User Story 1

- [ ] T007 [P] [US1] Create unit tests for `toggleUserModulePermissionSchema`, `updateAllUserPermissionsSchema`, and `<ModulePermissionToggle />` style variants in `stem-erp/src/components/permissions/__tests__/permissions.test.ts`

### Implementation for User Story 1

- [ ] T008 [P] [US1] Create `<ModulePermissionToggle />` component using `tailwind-variants` (`tv`) with explicit `SIM` and `NÃO` state indicators, semantic tokens (`bg-success`, `bg-muted`, `text-foreground`), and `role="switch"` accessibility in `stem-erp/src/components/permissions/module-permission-toggle.tsx`
- [ ] T009 [P] [US1] Create `<PermissionsRowActions />` component encapsulating row actions ("Liberar Todos os Módulos (SIM)", "Restringir Módulos Operacionais (NÃO)") inside a single gear button (`Settings` + `<DropdownMenu align="end">`) per Rule 8 of `AGENTS.md` in `stem-erp/src/components/permissions/permissions-row-actions.tsx`
- [ ] T010 [P] [US1] Create `usePermissionsTable` custom hook handling search by name/email, team filtering, and optimistic toggle updates in `stem-erp/src/components/permissions/use-permissions-table.ts`
- [ ] T011 [US1] Create `<PermissionsTable />` component rendering summary KPIs, search/filter bar, desktop table with the 4 module `SIM`/`NÃO` toggles (`Financeiro`, `ROI`, `Comunicação`, `Equipe & Acessos`) + gear menu, and responsive mobile cards in `stem-erp/src/components/permissions/permissions-table.tsx`
- [ ] T012 [US1] Create dedicated `/permissoes` page wrapped in `<DashboardShell title="Permissões de Acesso" subtitle="Configure individualmente o acesso de cada usuário aos módulos do sistema com botões SIM e NÃO">` in `stem-erp/src/app/permissoes/page.tsx`
- [ ] T013 [US1] Add quick navigation button to `/permissoes` in the header of `stem-erp/src/app/equipe/page.tsx`

**Checkpoint**: User Story 1 completa e testável de ponta a ponta em `/permissoes`.

---

## Phase 4: User Story 2 - Aplicação das Permissões na Navegação e Proteção de Acesso aos Módulos (Priority: P1)

**Goal**: Garantir que o menu lateral (`AppSidebar` e `MobileNavDrawer`) exiba apenas os módulos com permissão **`SIM`** para o usuário autenticado (incluindo o sub-item `/permissoes` em **Equipe & Acessos**) e bloquear o acesso direto por URL a módulos marcados como **`NÃO`**.

**Independent Test**: Configurar `Financeiro: NÃO` para um usuário e verificar que o módulo "Finanças" desaparece da barra lateral e que acessar `/dashboard`, `/planejamento` ou `/lancamentos` redireciona automaticamente para o primeiro módulo permitido.

### Tests for User Story 2

- [ ] T014 [P] [US2] Update sidebar contract tests to verify `TEAM_SUB_ITEMS` (`/equipe` and `/permissoes`) and module visibility filtering by `UserModulePermissionsDTO` in `stem-erp/src/components/layout/__tests__/app-sidebar.test.ts`

### Implementation for User Story 2

- [ ] T015 [P] [US2] Update `AppSidebar` to export `TEAM_SUB_ITEMS` (`Equipes & Integrantes` -> `/equipe`, `Permissões` -> `/permissoes`) and filter `Finanças`, `ROI`, `Comunicação`, and `Equipe & Acessos` visibility based on `currentUser.permissions` in `stem-erp/src/components/layout/app-sidebar.tsx`
- [ ] T016 [P] [US2] Update `MobileNavDrawer` to render `TEAM_SUB_ITEMS` and filter module groups based on `currentUser.permissions` in `stem-erp/src/components/layout/mobile-nav-drawer.tsx`
- [ ] T017 [US2] Enforce server-side module access guard (`requireModuleAccess`) across module entry pages (`stem-erp/src/app/dashboard/page.tsx`, `stem-erp/src/app/planejamento/page.tsx`, `stem-erp/src/app/lancamentos/page.tsx`, `stem-erp/src/app/roi/page.tsx`, `stem-erp/src/app/roi/acoes/page.tsx`, `stem-erp/src/app/comunicacao/page.tsx`, `stem-erp/src/app/equipe/page.tsx`)

**Checkpoint**: User Stories 1 e 2 funcionando integradas com ocultação na sidebar e bloqueio real de rotas.

---

## Phase 5: User Story 3 - Prevenção de Auto-Bloqueio Administrativo e Permissões Padrão Iniciais (Priority: P2)

**Goal**: Impedir que o administrador logado desative (`NÃO`) o próprio acesso ao módulo de **Equipe & Acessos / Permissões** (tanto na UI quanto no servidor) e garantir atribuição automática de permissões iniciais coerentes ao criar novos integrantes.

**Independent Test**: Na tela `/permissoes`, localizar a linha do próprio usuário administrador logado e verificar que o toggle de **Equipe & Acessos** permanece fixo em `SIM` (desabilitado para revogação com aviso explicativo) e que a chamada de backend recusa tentativa de auto-revogação.

### Tests for User Story 3

- [ ] T018 [P] [US3] Add unit tests for self-lockout prevention (`canModifyUserModulePermission`), default permissions by role (`getDefaultModulePermissionsByRole`), and fallback route resolution (`getFirstAllowedRoute`) in `stem-erp/src/components/permissions/__tests__/permissions.test.ts`

### Implementation for User Story 3

- [ ] T019 [US3] Enforce self-lockout protection in `<PermissionsTable />` and `<PermissionsRowActions />` (disabling the `team` toggle for `currentUser.id` with explanatory tooltip) in `stem-erp/src/components/permissions/permissions-table.tsx` and `stem-erp/src/components/permissions/permissions-row-actions.tsx`

**Checkpoint**: Todas as 3 User Stories completas, protegidas e testadas.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Sincronização de mocks existentes nos testes, verificação de compilação TypeScript estrita e execução completa da suíte de testes.

- [ ] T020 [P] Update any existing test mocks of `AuthenticatedUserDTO` / `TeamMemberDTO` to include `permissions` if needed and run full test suite (`npm --prefix stem-erp test`)
- [ ] T021 Run static type check (`npx tsc --project stem-erp/tsconfig.json --noEmit`) and validate all scenarios from `specs/003-module-access-permissions/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Inicia imediatamente (`T001`, `T002`).
- **Foundational (Phase 2)**: Depende da Phase 1 (`T003`–`T006`) — bloqueia as fases de UI.
- **User Story 1 (Phase 3 - P1 MVP)**: Depende da Phase 2 (`T007`–`T013`).
- **User Story 2 (Phase 4 - P1)**: Depende da Phase 2 (`T014`–`T017`).
- **User Story 3 (Phase 5 - P2)**: Depende de US1 e Phase 2 (`T018`–`T019`).
- **Polish (Phase 6)**: Depende da conclusão das User Stories (`T020`–`T021`).

### Parallel Opportunities

- `T003` (`src/lib/permissions.ts`) e `T004` (`src/lib/validations/auth.ts`) podem rodar em paralelo.
- `T008` (`module-permission-toggle.tsx`), `T009` (`permissions-row-actions.tsx`) e `T010` (`use-permissions-table.ts`) atuam em arquivos distintos e podem ser desenvolvidos em paralelo.
- `T015` (`app-sidebar.tsx`) e `T016` (`mobile-nav-drawer.tsx`) podem ser executados em paralelo.

---

## Parallel Example: User Story 1

```bash
# 1. Criar componentes base de UI e hook da tabela de permissões em paralelo:
Task T008: "Create <ModulePermissionToggle /> in stem-erp/src/components/permissions/module-permission-toggle.tsx"
Task T009: "Create <PermissionsRowActions /> in stem-erp/src/components/permissions/permissions-row-actions.tsx"
Task T010: "Create usePermissionsTable hook in stem-erp/src/components/permissions/use-permissions-table.ts"

# 2. Integrar na tabela e na página /permissoes:
Task T011: "Create <PermissionsTable /> in stem-erp/src/components/permissions/permissions-table.tsx"
Task T012: "Create /permissoes page in stem-erp/src/app/permissoes/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Concluir Phase 1 (Schema Prisma + Tipos) e Phase 2 (Utilitários, Schemas Zod, Services e Actions).
2. Concluir Phase 3 (User Story 1): Tela `/permissoes` com toggles `SIM` / `NÃO` funcionando e persistindo no banco.
3. Concluir Phase 4 (User Story 2) e Phase 5 (User Story 3): Menu lateral dinâmico, guardas de rota e proteção contra auto-bloqueio.
4. Executar validação final na Phase 6 (`tsc --noEmit` + `npm test`).
