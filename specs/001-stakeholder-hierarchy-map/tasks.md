---
description: "Task list for Mapa Organizacional e Hierárquico de Stakeholders na Comunicação"
---

# Tasks: Mapa Organizacional e Hierárquico de Stakeholders na Comunicação

**Input**: Design documents from `/specs/001-stakeholder-hierarchy-map/`

**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `research.md`, `data-model.md`, `contracts/ui-and-actions-contract.md`, `quickstart.md`

**Tests**: Incluídos em conformidade com o Princípio IV da Constituição (*Testes Automatizados Obrigatórios*) e a Regra 7 do `AGENTS.md`.

**Organization**: Tarefas agrupadas por User Story para permitir implementação, validação e entrega incremental independente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode ser executada em paralelo (arquivos distintos, sem dependência de tarefas incompletas)
- **[Story]**: Rótulo da User Story correspondente (`[US1]`, `[US2]`, `[US3]`)
- Todos os itens incluem o caminho exato do arquivo no repositório (`stem-erp/...`)

## Path Conventions

- Aplicação Full-Stack Next.js App Router localizada em `stem-erp/`
- Código-fonte em `stem-erp/src/` e schema de banco de dados em `stem-erp/prisma/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar a estrutura de diretórios do novo submódulo visual do Mapa Organizacional e constantes semânticas.

- [X] T001 Criar a estrutura de diretório de componentes do mapa organizacional em `stem-erp/src/components/communication/org-map/`
- [X] T002 [P] Adicionar rótulos, descrições e metadados semânticos dos 4 níveis hierárquicos (`TIER_1_STRATEGIC`, `TIER_2_INSTITUTIONAL`, `TIER_3_TACTICAL`, `TIER_4_OPERATIONAL`) em `stem-erp/src/lib/communication-constants.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Evolução do schema Prisma, tipagens estritas de domínio, schema de validação Zod e camada de serviço base exigidos por todas as User Stories.

**⚠️ CRITICAL**: Nenhuma User Story pode ser iniciada antes da conclusão desta fase.

- [X] T003 Adicionar o campo auto-relacionado opcional `parentStakeholderId String?` (`onDelete: SetNull`) e os índices `@@index([teamId, organization])` e `@@index([teamId, parentStakeholderId])` ao model `Stakeholder` em `stem-erp/prisma/schema.prisma` e regenerar o Prisma Client
- [X] T004 [P] Definir as interfaces estritas `HierarchyTier` (`"TIER_1_STRATEGIC" | "TIER_2_INSTITUTIONAL" | "TIER_3_TACTICAL" | "TIER_4_OPERATIONAL"`), `OrgMapActionCardDTO` (`progressPercent: number` de `25` a `100`), `OrgMapStakeholderNode`, `OrgMapPartnerBranch` e `StakeholderOrgMapTree`, além de incluir `parentStakeholderId: string | null` em `StakeholderWithRelations` em `stem-erp/src/types/communication.ts`
- [X] T005 [P] Estender `createStakeholderSchema` e `updateStakeholderSchema` em `stem-erp/src/lib/validations/communication.ts` com o campo `parentStakeholderId: z.string().optional().nullable()`, mantendo as restrições existentes (`name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres")`, `power: z.enum(["LOW", "HIGH"])`, `interest: z.enum(["LOW", "HIGH"])`, `organization: z.string().optional().nullable()`) e impedindo que `parentStakeholderId` seja igual ao próprio `id` na atualização
- [X] T006 Atualizar `getStakeholders`, `getStakeholderById`, `createStakeholder` e `updateStakeholder` em `stem-erp/src/services/communication-service.ts` para ler e persistir `parentStakeholderId` (validando isolamento por `teamId` e evitando auto-referência) e preencher `organization` automaticamente com o nome do patrocinador quando `sponsorId` for informado e `organization` estiver em branco
- [X] T007 Implementar o motor puro determinístico `computeHierarchyTier` e `buildStakeholderHierarchyTree` em `stem-erp/src/lib/communication-hierarchy.ts` agrupando por Parceiro/Organização e encadeando verticalmente por peso de Poder e Interesse (`HIGH` + `HIGH` = peso `4`, `HIGH` + `LOW` = peso `3`, `LOW` + `HIGH` = peso `2`, `LOW` + `LOW` = peso `1`) ou `parentStakeholderId` explícito com proteção contra ciclos via DFS

**Checkpoint**: Fundação concluída — a construção das User Stories pode começar.

---

## Phase 3: User Story 1 - Visualização do Mapa Hierárquico de Parceiros e Stakeholders (Priority: P1) 🎯 MVP

**Goal**: Substituir a visualização padrão da página de Comunicação pelo gráfico interativo em árvore (estilo Organization Map), exibindo os Parceiros/Organizações no topo de cada ramo e seus stakeholders organizados hierarquicamente por Poder e Interesse (ex: `SESI` → `Diretoria` → `Técnicos` → `Professores`), com controles de busca, filtro por parceiro, modos de visão, zoom e minimapa.

**Independent Test**: Acessar `/comunicacao` e verificar que a aba/visão principal renderiza o Mapa Organizacional com conectores ortogonais, agrupando os stakeholders por Parceiro e encadeando-os verticalmente do maior para o menor nível de Poder e Interesse, além de validar a árvore via teste automatizado em `communication-hierarchy.test.ts`.

### Tests for User Story 1

- [X] T008 [P] [US1] Criar testes unitários exaustivos para `computeHierarchyTier` e `buildStakeholderHierarchyTree` (cobrindo o cenário `SESI` → `Diretoria` → `Técnicos` → `Professores`, múltiplos parceiros, filtro por organização, busca textual e prevenção de ciclos em `parentStakeholderId`) em `stem-erp/src/components/communication/__tests__/communication-hierarchy.test.ts`

### Implementation for User Story 1

- [X] T009 [P] [US1] Implementar o Custom Hook `useStakeholderOrgMap` em `stem-erp/src/hooks/use-stakeholder-org-map.ts` gerenciando modo de visão (`"hierarchy" | "structure" | "relations"`), filtro de parceiro (`"ALL"` ou chave do parceiro), busca textual, nível de zoom (`0.6` a `1.4`), colapso de ramos e stakeholder selecionado
- [X] T010 [P] [US1] Criar o componente `OrgMapNodeCard` em `stem-erp/src/components/communication/org-map/org-map-node-card.tsx` (máx. 150 linhas) com `tv()` fora do componente, `slots`, `VariantProps` e variantes semânticas por nível (`purple`, `primary`, `success`, `amber`), exibindo indicador de status, cargo, badges de Poder/Interesse e botão `+` de adição rápida
- [X] T011 [P] [US1] Criar o componente `OrgMapHeaderControls` e minimapa panorâmico em `stem-erp/src/components/communication/org-map/org-map-controls.tsx` (máx. 150 linhas) com contadores em tempo real (`organizações`, `grupos`, `stakeholders`, `planos`), seletor de escopo (`Todos os Parceiros` vs. parceiro específico), alternador `Hierarquia | Estrutura | Relações`, busca e controles de zoom
- [X] T012 [US1] Implementar o container recursivo da árvore `StakeholderOrgMap` em `stem-erp/src/components/communication/org-map/stakeholder-org-map.tsx` (máx. 150 linhas) renderizando o nó raiz da Equipe, ramos de Parceiros, linhas conectoras ortogonais verticais/horizontais e os 4 estados de UI (*Loading*, *Error*, *Empty State* e *Success*)
- [X] T013 [US1] Atualizar `CommunicationView` em `stem-erp/src/components/communication/communication-view.tsx` para definir o **Mapa Organizacional** como a visualização primária padrão da página de Comunicação dentro do `<DashboardShell>`
- [X] T014 [US1] Atualizar os dados de seed em `stem-erp/prisma/seed.ts` incluindo o exemplo real hierárquico do parceiro `"SESI"` (`"Diretoria"` com `HIGH/HIGH`, `"Técnicos"` com `LOW/HIGH` e `"Professores"` com `LOW/LOW`) para demonstração imediata na árvore

**Checkpoint**: User Story 1 (MVP) funcional e testável de forma independente.

---

## Phase 4: User Story 2 - Cadastro de Stakeholder Diretamente Integrado ao Gráfico Hierárquico (Priority: P1)

**Goal**: Permitir cadastrar um novo stakeholder vinculado a um Parceiro/Organização (pelo botão principal ou clicando em `+` diretamente sobre um nó de Parceiro ou Stakeholder superior no gráfico), posicionando-o imediatamente no degrau hierárquico correspondente da árvore.

**Independent Test**: Clicar em "Novo Stakeholder" (ou no atalho `+` de um nó como `"SESI"` ou `"Diretoria"`), preencher os dados e verificar que o stakeholder aparece imediatamente encadeado na posição correta da árvore do parceiro.

### Tests for User Story 2

- [X] T015 [P] [US2] Adicionar testes unitários em `stem-erp/src/components/communication/__tests__/communication-validations.test.ts` validando `parentStakeholderId` opcional/nulo, rejeição de auto-referência no `updateStakeholderSchema` e combinação de `organization` com níveis de `power` e `interest`

### Implementation for User Story 2

- [X] T016 [US2] Atualizar `createStakeholderAction` e adicionar `updateStakeholderHierarchyAction` em `stem-erp/src/actions/communication-actions.ts` para processar `parentStakeholderId`, validar RBAC (`role !== "AUDITOR"`) e executar `revalidatePath("/comunicacao")`
- [X] T017 [US2] Atualizar `CreateStakeholderDialog` em `stem-erp/src/components/communication/create-stakeholder-dialog.tsx` para aceitar pré-preenchimento de Parceiro/Organização e Superior Hierárquico (`defaultOrganization`, `defaultSponsorId`, `defaultParentStakeholderId`), exibir sugestões de Parceiros já existentes no mapa, seletor opcional de "Superior Hierárquico no Parceiro" e prévia do nível hierárquico resultante (`Degrau 1 a 4`)
- [X] T018 [US2] Conectar os gatilhos de adição rápida (`onAddChildStakeholder` nos nós de Parceiro e de Stakeholder de `StakeholderOrgMap`) ao `CreateStakeholderDialog` em `stem-erp/src/components/communication/communication-view.tsx`
- [X] T019 [US2] Atualizar `StakeholdersListTab` em `stem-erp/src/components/communication/stakeholders-list-tab.tsx` para exibir o Parceiro/Organização e o Nível Hierárquico / Superior de cada stakeholder em sincronia com o gráfico

**Checkpoint**: User Stories 1 e 2 completas e integradas — qualquer stakeholder cadastrado já nasce posicionado na árvore hierárquica do parceiro.

---

## Phase 5: User Story 3 - Cartões de Planos/Ações de Comunicação na Base da Árvore e Inspeção Interativa (Priority: P2)

**Goal**: Exibir cartões de planos/ações de comunicação em andamento conectados na base dos stakeholders da árvore (padrão "In Progress" da imagem de referência) e abrir um diálogo/gaveta de inspeção ao clicar em qualquer nó para visualizar detalhes, alterar posição hierárquica, gerar relatórios ou registrar disparos/feedbacks.

**Independent Test**: Verificar a renderização dos cartões inferiores de planos ativos sob os nós folhas da árvore e clicar em um stakeholder no gráfico para abrir o painel de inspeção e acionar "Gerar Relatório", "Criar Plano" ou "Registrar Disparo".

### Implementation for User Story 3

- [X] T020 [P] [US3] Criar o componente `OrgMapPlanCard` em `stem-erp/src/components/communication/org-map/org-map-plan-card.tsx` (máx. 150 linhas) com `tv()` fora do componente, exibindo o status `"Em Andamento / Plano Ativo"`, título da ação, canal, frequência e barra de progresso semântica (`bg-primary`, `bg-success`, `bg-purple`)
- [X] T021 [P] [US3] Criar o componente `StakeholderInspectorDialog` em `stem-erp/src/components/communication/org-map/stakeholder-inspector-dialog.tsx` (máx. 150 linhas) exibindo detalhes do stakeholder clicado, Gap de Engajamento (`Atual → Almejado`), ajuste rápido de Poder/Interesse/Superior e botões de ação rápida (`Gerar Relatório`, `Novo Plano`, `Registrar Disparo`, `Adicionar Subordinado`)
- [X] T022 [US3] Integrar a renderização de `OrgMapPlanCard` na base das ramificações de `StakeholderOrgMap` em `stem-erp/src/components/communication/org-map/stakeholder-org-map.tsx`
- [X] T023 [US3] Conectar o clique nos nós do gráfico ao `StakeholderInspectorDialog` e aos fluxos existentes de `ReportGeneratorTab`, `CreateCommunicationPlanDialog` e `LogCommunicationDialog` em `stem-erp/src/components/communication/communication-view.tsx`

**Checkpoint**: Todas as User Stories (US1, US2 e US3) estão completas e funcionais de ponta a ponta.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Garantir qualidade de código, acessibilidade, responsividade Mobile-First e aprovação em todos os Quality Gates da Constituição.

- [X] T024 [P] Auditar todos os arquivos criados/modificados em `stem-erp/src/components/communication/` para confirmar limite de 150 linhas por componente visual, zero uso de `any` e zero códigos de cores hexadecimais/arbitrários
- [X] T025 Executar a bateria de testes automatizados (`npm test` via `tsx --test` em `stem-erp/`) garantindo 100% de aprovação em menos de 3 segundos
- [X] T026 Executar a verificação estática de tipos (`npx tsc --noEmit`) e linter (`npm run lint`) em `stem-erp/` conforme o guia `specs/001-stakeholder-hierarchy-map/quickstart.md`
