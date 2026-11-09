---
description: "Tarefas de implementação do módulo Tarefas, Gantt e RACI"
---

# Tasks: Tarefas por setor, Gantt e RACI

**Input** — `specs/006-tarefas-gantt-raci/`

**Prerequisites** — [Plano](plan.md), [especificação](spec.md), [pesquisa](research.md), [modelo](data-model.md), [contrato](contracts/tarefas.md) e [validação](quickstart.md).

**Tests** — A Constituição e o plano exigem testes. Escreva os testes de cada história antes do código que os fará passar.

## Format

Use `- [ ] TNNN [P] [USn] descrição com caminho`. `[P]` indica tarefas independentes no mesmo ponto da fase. A etiqueta da história só aparece nas fases 3 a 5.

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Verificar Node/npm, instalar o lockfile de `stem-erp/package-lock.json`, verificar regras de ignore em `stem-erp/.gitignore` e consultar os guias Next instalados em `stem-erp/node_modules/next/dist/docs/`.
- [X] T002 Configurar testes de componentes com Testing Library e Playwright em `stem-erp/package.json`, `stem-erp/playwright.config.ts` e fixtures em `stem-erp/e2e/tasks.fixtures.ts`.
- [X] T003 Executar e verificar o backup exigido por `AGENTS.md` via `stem-erp/scripts/db-backup-sync.ts`, confirmar a sincronização Neon e o snapshot antes de editar `stem-erp/prisma/schema.prisma`.

**T003** — Workflow de backup concluído. A branch de recuperação foi sincronizada e o snapshot JSON foi gerado.

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T004 Adicionar modelos e índices aditivos em `stem-erp/prisma/schema.prisma`. Usar datas civis inclusivas PostgreSQL DATE, estado inicial A fazer, autor imutável com relação anulável, unicidade por tarefa/membro/papel em R/C/I, pares dirigidos únicos por equipe e posições únicas de caminho com tarefas sem repetição. Criar o campo de permissão `canAccessTasks` desabilitado por padrão.
- [X] T005 [P] Integrar permissão `tasks` e escopo no servidor e na navegação em `stem-erp/src/types/auth.ts`, `stem-erp/src/lib/permissions.ts`, `stem-erp/src/lib/validations/auth.ts`, `stem-erp/src/services/auth-service.ts`, `stem-erp/src/components/layout/app-sidebar.tsx`, `stem-erp/src/components/layout/mobile-nav-drawer.tsx` e `stem-erp/src/components/permissions/`. Restringir concessões e consultas à equipe autorizada e manter auditor somente leitura.
- [X] T006 [P] Ajustar o fluxo de backup, recuperação e aplicação protegida em `stem-erp/scripts/db-backup-sync.ts`, `stem-erp/scripts/db-restore-snapshot.ts`, `stem-erp/scripts/db-safe-migrate.ts` e `render.yaml`. Proteger novas entidades e snapshots antigos, verificar sucesso da recuperação Neon e separar o alvo de teste.
- [X] T007 Gerar o cliente e preparar PostgreSQL isolado pelo fluxo seguro de `stem-erp/scripts/db-safe-migrate.ts`. Conferir schema, escopo e permissões com a configuração de `stem-erp/e2e/tasks.fixtures.ts`.

## Phase 3: User Story 1 - Cadastrar tarefas e atribuir responsabilidades (P1, MVP)

**Teste independente** — Criar uma tarefa, confirmar A e ausência de R, atribuir dois executores e conferir as mesmas letras nos detalhes e na matriz.

- [X] T008 [P] [US1] Escrever testes de datas, atribuições, escopo e preservação de autoria em `stem-erp/src/lib/validations/__tests__/tasks.test.ts` e `stem-erp/src/services/__tests__/task-service.integration.test.ts`.
- [X] T009 [P] [US1] Escrever testes de lista, atribuição e matriz em `stem-erp/src/components/tasks/__tests__/task-raci.test.ts` e `stem-erp/e2e/tasks-raci.spec.ts`.
- [X] T010 [US1] Implementar DTOs e validação Zod de campos, dias civis, revisões e papéis em `stem-erp/src/types/tasks.ts` e `stem-erp/src/lib/validations/tasks.ts`.
- [X] T011 [US1] Implementar leitura por equipe, cadastro e edição atômicos, revisão e histórico RACI em `stem-erp/src/services/task-service.ts` e ações tipadas em `stem-erp/src/actions/tasks.actions.ts`. Validar membros ativos e derivar o único A da sessão.
- [X] T012 [US1] Montar a rota e abas com `DashboardShell`, formulário, lista, detalhes e matriz paginada em `stem-erp/src/app/tarefas/page.tsx` e `stem-erp/src/components/tasks/`. Verificar filtro, feedback e teclado.

## Phase 4: User Story 2 - Acompanhar o cronograma no Gantt (P2)

**Teste independente** — Com tarefas de dois setores e uma dependência, comparar barras e setas nas escalas de dia e semana e filtrar um setor.

- [X] T013 [P] [US2] Escrever testes de geometria inclusiva, conflitos e pontas externas em `stem-erp/src/lib/__tests__/task-schedule.test.ts` e `stem-erp/e2e/tasks-gantt.spec.ts`.
- [X] T014 [P] [US2] Escrever testes de ciclo e transações de arestas recíprocas em `stem-erp/src/services/__tests__/task-service.integration.test.ts`.
- [X] T015 [US2] Implementar operações de dependência e validação serializável com repetição limitada em `stem-erp/src/services/task-service.ts`, `stem-erp/src/actions/tasks.actions.ts` e `stem-erp/src/lib/task-schedule.ts`.
- [X] T016 [US2] Montar Gantt com grade rolável, barras, setas, escala, detalhes e conflito de datas em `stem-erp/src/components/tasks/task-gantt.tsx` e integrar dependências no painel `stem-erp/src/components/tasks/task-detail.tsx`.

## Phase 5: User Story 3 - Construir e visualizar um caminho de risco (P3)

**Teste independente** — Salvar A → B → C com A → D fora do caminho, destacar no Gantt, remover B → C e conferir aviso e perda do destaque.

- [X] T017 [P] [US3] Escrever testes de seleção, sequência, destaque e invalidação em `stem-erp/src/lib/__tests__/task-schedule.test.ts` e `stem-erp/e2e/tasks-risk.spec.ts`.
- [X] T018 [US3] Persistir caminho com nome, motivo e ao menos duas etapas ordenadas ligadas por dependências diretas. Derivar pares ausentes e usar revisão e transação em `stem-erp/src/services/task-service.ts`, `stem-erp/src/actions/tasks.actions.ts` e `stem-erp/src/lib/task-schedule.ts`.
- [X] T019 [US3] Construir seletor de sucessoras, diagrama React Flow e sequência textual em `stem-erp/src/components/tasks/task-risk-view.tsx` e reutilizar `stem-erp/src/components/canvas/flow-canvas-shell.tsx`. Ligar a seleção de destaque ao Gantt.

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T020 Executar cenários das três histórias, teclado e mobile, teste com 50 tarefas e gates de lint, tipos, testes, E2E e build de `stem-erp/package.json` conforme `specs/006-tarefas-gantt-raci/quickstart.md`.
- [X] T021 Conferir mudanças, concluir os marcadores em `specs/006-tarefas-gantt-raci/tasks.md`, fazer commit, integrar a branch base `origin/main` com pull e confirmar o push da branch da feature após os gates.

## Dependencies & Execution Order

- Setup → fundação → US1 → US2 → US3 → validação e publicação.
- A US1 é o MVP. As histórias seguintes podem ser validadas isoladamente com fixtures das tarefas e dependências das fases anteriores.
- T005 e T006 podem avançar juntos após T004. Testes marcados com `[P]` em cada história podem ser escritos em paralelo antes da implementação correspondente.

## Parallel Examples

- **US1** — T008 cobre serviços e validação enquanto T009 cobre UI e E2E.
- **US2** — T013 cobre projeção e visualização enquanto T014 cobre transações.
- **US3** — Em T017, a projeção pura e a jornada E2E podem ser preparadas em arquivos independentes.

## Implementation Strategy

Validar o cadastro com RACI, adicionar Gantt e por fim integrar o diagrama de risco. Manter as quatro visões sobre os mesmos dados e publicar depois dos gates completos.
