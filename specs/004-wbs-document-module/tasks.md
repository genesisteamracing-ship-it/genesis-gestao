# Tasks: Módulo Documentos e Estrutura Analítica do Projeto (WBS / EAP)

**Input**: Design documents from `specs/004-wbs-document-module/` (`spec.md`, `plan.md`, `data-model.md`, `contracts/wbs-contract.md`, `research.md`, `quickstart.md`)  
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/  
**Tests**: Testes obrigatórios de acordo com a Constituição (testes unitários de roll-up matemático e esquemas Zod).  
**Organization**: Tarefas organizadas por fases de infraestrutura/fundação e por histórias de usuário para entrega incremental e independente.

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **[P]**: Tarefa paralelizável (arquivos independentes, sem bloqueios de tarefas incompletas)
- **[Story]**: Identificador da história de usuário correspondente (`[US1]`, `[US2]`, `[US3]`, `[US4]`)
- Todos os caminhos de arquivos estão explícitos e referenciam a raiz do projeto `stem-erp/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Criação do modelo de dados no Prisma e definição dos tipos de domínio compartilhados

- [X] T001 Adicionar o modelo `WbsNode` com auto-relacionamento hierárquico `parentId` e o campo `canAccessDocuments Boolean @default(true)` no modelo `User` em `stem-erp/prisma/schema.prisma`
- [X] T002 Gerar cliente Prisma atualizado executando `npx prisma generate` e aplicar migração no banco de dados via `npx prisma db push` em `stem-erp/prisma/schema.prisma`
- [X] T003 [P] Criar interfaces e tipos TypeScript de domínio da WBS (`WbsTreeNode`, `WbsSummaryMetrics`, `WbsNodeStatus`) em `stem-erp/src/types/wbs.ts`
- [X] T004 [P] Estender o tipo `AuthenticatedUserDTO` incluindo a permissão `documents: boolean` em `stem-erp/src/types/auth.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Esquemas de validação Zod, algoritmo de roll-up da Regra dos 100% com testes unitários e Server Actions de persistência

> ⚠️ **CRITICAL**: Nenhuma tarefa das histórias de usuário pode iniciar sem a conclusão desta fase.

- [X] T005 [P] Implementar esquemas declarativos Zod (`CreateWbsNodeSchema`, `UpdateWbsNodeSchema`) com validações de regex de código EAP, centavos inteiros e restrições de texto em `stem-erp/src/lib/validations/wbs.schema.ts`
- [X] T006 [P] Criar testes unitários para os esquemas de validação Zod cobrindo entradas válidas e cenários de erro em `stem-erp/tests/wbs/wbs-schema.test.ts`
- [X] T007 [P] Implementar serviço puro de agregação matemática e montagem da árvore da WBS (`calculateWbsRollup`, `buildWbsTree`) aplicando a Regra dos 100% em centavos inteiros em `stem-erp/src/services/wbs-rollup.service.ts`
- [X] T008 [P] Criar testes unitários para a função de roll-up cobrindo agregação de custos em centavos e horas em árvores de múltiplos níveis em `stem-erp/tests/wbs/wbs-rollup.test.ts`
- [X] T009 Implementar Server Actions tipadas (`getWbsTreeAction`, `createWbsNodeAction`, `updateWbsNodeAction`, `deleteWbsNodeAction`) com isolamento por `teamId` em `stem-erp/src/actions/wbs.actions.ts`

**Checkpoint**: Fundação pronta - testes de serviço e esquemas passando; implementação das histórias de usuário desbloqueada.

---

## Phase 3: User Story 1 - Acesso ao Módulo Documentos e Visualização da WBS (Priority: P1) 🎯 MVP

**Goal**: Permitir que o usuário acesse o novo módulo Documentos na barra lateral e visualize a tela principal da WBS envolvida por `<DashboardShell>` com resumo de métricas e árvore hierárquica colapsável.

**Independent Test**: Acessar `/documentos`, verificar a presença da barra lateral fixa, cabeçalho padronizado com título e subtítulo contextuais, métricas consolidadas e árvore de entregáveis da equipe ativa.

- [X] T010 [P] [US1] Adicionar o módulo Documentos com ícone `FolderGit2`, verificação de rota ativa e permissão `permissions.documents` em `stem-erp/src/components/layout/app-sidebar.tsx`
- [X] T011 [P] [US1] Adicionar o módulo Documentos com navegação correspondente no menu gaveta mobile em `stem-erp/src/components/layout/mobile-nav-drawer.tsx`
- [X] T012 [P] [US1] Criar componente de métricas consolidadas do escopo (`WbsHeaderMetrics`) utilizando `tailwind-variants` (`tv`) e tokens semânticos em `stem-erp/src/components/wbs/wbs-header-metrics.tsx`
- [X] T013 [US1] Criar componente de tabela e árvore hierárquica colapsável (`WbsTreeTable`) com recuos visuais, botões de expandir/recolher e badges de disciplina em `stem-erp/src/components/wbs/wbs-tree-table.tsx`
- [X] T014 [US1] Criar custom hook `useWbs` para encapsular estado de nós expandidos, busca textual, filtro de disciplina e carregamento de dados em `stem-erp/src/hooks/use-wbs.ts`
- [X] T015 [US1] Criar página do módulo Documentos (`/documentos`) envolvida pelo `<DashboardShell>` com `title="Documentos"` e `subtitle="Estrutura Analítica do Projeto (WBS / EAP) e Decomposição de Escopo"` em `stem-erp/src/app/documentos/page.tsx`

**Checkpoint**: User Story 1 funcional de forma independente - módulo visível na navegação, layout shell renderizado e árvore de leitura operacional.

---

## Phase 4: User Story 2 - Cadastro e Decomposição de Entregáveis Hierárquicos (Priority: P1) 🎯 MVP

**Goal**: Permitir o cadastro, detalhamento e decomposição de entregáveis e pacotes de trabalho com código EAP, disciplina, responsável técnico, custo de fabricação e horas estimadas.

**Independent Test**: Criar um entregável raiz (`1.0`), adicionar um sub-entregável (`1.1`) e um pacote de trabalho folha (`1.1.1`) através do menu de engrenagem, verificando a persistência no banco e a atualização visual na árvore.

- [X] T016 [P] [US2] Criar componente de ações de linha (`WbsRowActions`) com botão único de engrenagem (`Settings`) e `DropdownMenu` ("Adicionar Sub-entregável", "Editar", "Excluir") em `stem-erp/src/components/wbs/wbs-row-actions.tsx`
- [X] T017 [US2] Criar componente modal responsivo de cadastro/edição (`WbsNodeModal`) com formulário validado por Zod, conversão de centavos e seleção de responsável técnico em `stem-erp/src/components/wbs/wbs-node-modal.tsx`
- [X] T018 [US2] Integrar mutações de criação, edição e exclusão de entregáveis com notificações de feedback visual no custom hook `useWbs` em `stem-erp/src/hooks/use-wbs.ts`
- [X] T019 [US2] Adicionar modal de diálogo de confirmação para exclusão de nós pais que alertam sobre remoção em cascata dos nós filhos em `stem-erp/src/components/wbs/wbs-tree-table.tsx`

**Checkpoint**: User Stories 1 e 2 concluídas - escopo completo de MVP entregue com visualização e mutação hierárquica.

---

## Phase 5: User Story 3 - Consolidação Orçamentária e Esforço (Roll-up dos Pacotes de Trabalho) (Priority: P2)

**Goal**: Garantir a aplicação estrita da Regra dos 100%, calculando e exibindo em tempo real a soma dos custos e horas dos pacotes de trabalho folha nos nós superiores e nos cartões consolidados do topo.

**Independent Test**: Cadastrar ou alterar o custo de um pacote folha e constatar a atualização imediata dos valores consolidados do subsistema pai e do totalizador geral sem necessidade de recarregar a página.

- [X] T020 [US3] Conectar o recálculo do serviço de roll-up nas Server Actions de criação e atualização em `stem-erp/src/actions/wbs.actions.ts`
- [X] T021 [US3] Adicionar badges visuais diferenciando valores diretos informados (nós folha) de valores calculados por agregação (nós pais com filhos) em `stem-erp/src/components/wbs/wbs-tree-table.tsx`
- [X] T022 [US3] Atualizar os cartões de métricas do topo (`WbsHeaderMetrics`) refletindo o somatório total acumulado e a contagem de pacotes folha em `stem-erp/src/components/wbs/wbs-header-metrics.tsx`

**Checkpoint**: User Story 3 funcional - integridade matemática da Regra dos 100% garantida de ponta a ponta.

---

## Phase 6: User Story 4 - Modo Apresentação e Auditoria para Juízes de Project Management (Priority: P3)

**Goal**: Disponibilizar modo limpo de leitura para bancas de avaliação e jurados de Project Management com filtros rápidos de profundidade (Nível 1, Nível 2, Todos) e diagramação para impressão/projeção.

**Independent Test**: Ativar o "Modo Apresentação" na interface, alternar para "Nível 2" e verificar a ocultação de botões de edição e a adaptação do layout limpo.

- [X] T023 [P] [US4] Criar componente de cabeçalho de apresentação com alternadores de profundidade e acionamento de impressão (`WbsPresentationView`) em `stem-erp/src/components/wbs/wbs-presentation-view.tsx`
- [X] T024 [US4] Implementar lógica de expansão/recolhimento em massa por nível de profundidade (`depth <= 2`, etc.) e flag `isPresentationMode` no custom hook `useWbs` em `stem-erp/src/hooks/use-wbs.ts`
- [X] T025 [US4] Configurar regras de mídia de impressão (`@media print`) e ocultação de controles utilitários na página em `stem-erp/src/app/documentos/page.tsx`

**Checkpoint**: Todas as 4 histórias de usuário finalizadas e prontas para uso em produção e bancas avaliadoras.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verificações finais de qualidade, segurança de rotas, integridade de build e testes

- [X] T026 [P] Criar layout do módulo com proteção de permissão de acesso (`canAccessDocuments`) em `stem-erp/src/app/documentos/layout.tsx`
- [X] T027 Executar a bateria completa de testes automatizados com `npm test` verificando 100% de aprovação determinística
- [X] T028 Validar ausência de erros de compilação e tipagem estrita com `npm run typecheck` (`tsc --noEmit`)
- [X] T029 Executar o roteiro de validação ponta a ponta descrito em `specs/004-wbs-document-module/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Pode iniciar imediatamente.
- **Phase 2 (Foundational)**: Depende da conclusão da Phase 1 - BLOQUEIA todas as histórias de usuário.
- **Phase 3 (User Story 1 - P1 MVP)**: Depende da Phase 2.
- **Phase 4 (User Story 2 - P1 MVP)**: Depende da Phase 3 (integração visual de ações e modais sobre a árvore).
- **Phase 5 (User Story 3 - P2)**: Depende da Phase 4.
- **Phase 6 (User Story 4 - P3)**: Depende da Phase 3 e 4.
- **Phase 7 (Polish)**: Depende da conclusão das fases de histórias de usuário selecionadas.

### Parallel Opportunities

- **Phase 1**: `T003` e `T004` podem rodar em paralelo após `T001`/`T002`.
- **Phase 2**: `T005`, `T006`, `T007` e `T008` podem ser desenvolvidos em paralelo por arquivos distintos.
- **Phase 3**: `T010`, `T011` e `T012` podem rodar em paralelo.
- **Phase 4**: `T016` pode rodar em paralelo com a preparação de `T017`.
- **Phase 6**: `T023` pode rodar em paralelo com o refinamento do hook.

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Execução paralela de esquemas Zod e testes:
Task T005: "stem-erp/src/lib/validations/wbs.schema.ts"
Task T006: "stem-erp/tests/wbs/wbs-schema.test.ts"

# Execução paralela de serviço de roll-up e testes:
Task T007: "stem-erp/src/services/wbs-rollup.service.ts"
Task T008: "stem-erp/tests/wbs/wbs-rollup.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 & User Story 2)

1. Executar **Phase 1 (Setup)** e **Phase 2 (Foundational)**.
2. Executar **Phase 3 (User Story 1)**: Visualização da tela e árvore no layout shell.
3. Executar **Phase 4 (User Story 2)**: CRUD hierárquico com código EAP e menu de engrenagem.
4. **Checkpoint de Validação**: Testar criação de entregáveis ponta a ponta. Neste ponto, o MVP do módulo Documentos com WBS está totalmente utilizável.

### Incremental Delivery

1. Setup + Foundational -> Base técnica pronta.
2. US1 + US2 -> MVP funcional de visualização e edição da EAP.
3. US3 -> Roll-up automático da Regra dos 100% em centavos e horas.
4. US4 -> Modo limpo de auditoria e apresentação para os juízes de Project Management.
5. Polish -> Validação de permissões, tipos e bateria de testes.
