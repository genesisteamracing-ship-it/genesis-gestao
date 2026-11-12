# Phase 0 Research: Painel de Minhas Atividades e KPIs de Desempenho Individual

**Feature**: `007-minhas-atividades` | **Date**: 2026-11-12

## 1. Integração com o Módulo de Tarefas e Navegação

- **Decision**: Integrar "Minhas atividades" como uma visão de primeira classe dentro de `TASK_VIEWS` (`src/lib/task-navigation.ts`) acessível em `/tarefas?tab=my-activities` e listada no menu lateral expansível `TaskNavGroup` (`src/components/layout/task-nav-group.tsx`).
- **Rationale**: O projeto já possui o módulo `tasks` com `requireModuleAccess("tasks")`, `resolveTaskScope(user)`, `getTaskWorkspace(scope)` e `TaskNavGroup` na barra lateral fixa (`AppSidebar`). Adicionar a aba `my-activities` em `TASK_VIEWS` reutiliza toda a infraestrutura de controle de acesso, seleção de equipe/temporada (`SeasonProvider`), `DashboardShell` e cabeçalho dinâmico (`title` + `subtitle`) sem duplicar rotas de servidor.
- **Alternatives considered**:
  - *Rota isolada `/minhas-atividades`*: Exigiria duplicar `requireModuleAccess`, `resolveTaskScope`, `loading.tsx`, `error.tsx` e um novo item raiz na sidebar, fragmentando o módulo de Tarefas. Rejeitado em favor da coesão modular, podendo futuramente ter redirect simples se necessário.

## 2. Extensão do Ciclo de Vida de Tarefas (`CANCELLED` e Timestamps)

- **Decision**: Adicionar o valor `CANCELLED` ao enum `TaskStatus` no Prisma (`TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`) e os campos opcionais `completedAt DateTime?` e `cancelledAt DateTime?` no model `Task`.
- **Rationale**:
  - A especificação exige que o usuário assinale atividades como *A fazer*, *Em andamento*, *Concluída / Feito* ou *Cancelada* (FR-005).
  - Para calcular a **Taxa de Pontualidade** (% de entregas realizadas até `endDate`) com precisão (FR-006, FR-007), é indispensável persistir `completedAt` no momento da transição para `DONE`, pois `updatedAt` é sobrescrito por qualquer edição posterior (como correção de título ou descrição).
  - Armazenar `cancelledAt` garante rastreabilidade do encerramento sem poluir `completedAt`.
- **Alternatives considered**:
  - *Usar `updatedAt` como proxy de conclusão*: Impreciso, pois qualquer alteração posterior na tarefa alteraria retroativamente a métrica de pontualidade. Rejeitado.
  - *Tabela separada de histórico de status (`TaskStatusHistory`)*: Útil para auditoria completa, mas excessivo para os requisitos atuais. Campos `completedAt` e `cancelledAt` na tabela `Task` resolvem 100% dos KPIs com complexidade mínima e sem joins extras.

## 3. Escopo de Atribuição e Cálculo Determinístico de Prazos e KPIs

- **Decision**:
  - **Escopo de "Minhas Atividades"**: Considerar todas as tarefas da equipe ativa onde o usuário autenticado possui atribuição com papel `R` (Executor). Opcionalmente permitir filtro rápido para tarefas onde atua como `A` (Responsável/Autor), mantendo `R` como padrão focado na execução.
  - **Cálculo de Prazos (Timezone-Safe)**: Comparar `endDate` (armazenado como `@db.Date` / `YYYY-MM-DD`) com a data local corrente (`YYYY-MM-DD`) utilizando utilitário puro em `src/lib/my-activities.ts` para evitar desvios de fuso horário UTC vs local.
  - **Fórmulas de KPI**:
    - `Total Atribuído` = total de tarefas atribuídas ao usuário na equipe ativa.
    - `Concluídas` = tarefas com `status === 'DONE'`.
    - `Pendentes` = tarefas com `status === 'TODO' || status === 'IN_PROGRESS'`.
    - `Em Atraso` = tarefas pendentes cuja `endDate < today`.
    - `Canceladas` = tarefas com `status === 'CANCELLED'`.
    - `Taxa de Conclusão` = `Math.round((completedCount / Math.max(1, totalAssigned - cancelledCount)) * 100)` (excluindo canceladas da base ativa, ou `0%` se não houver tarefas ativas).
    - `Taxa de Pontualidade` = `Math.round((onTimeCount / completedCount) * 100)` onde `onTimeCount` conta tarefas `DONE` cuja data de `completedAt` (ou `updatedAt` como fallback para legadas) é `<= endDate`. Quando `completedCount === 0`, exibe `—` (neutro).
- **Rationale**: Funções puras em `src/lib/my-activities.ts` permitem 100% de cobertura por testes unitários determinísticos (injetando `referenceDate` nos testes) e zero recálculo inconsistente entre cliente e servidor.
- **Alternatives considered**:
  - *Queries agregadas SQL no banco*: Dificultaria o reaproveitamento instantâneo no cliente após atualizações otimistas ou filtros locais, além de depender do banco para testes unitários das fórmulas. Rejeitado.

## 4. Padrão de Interface, Ações Rápidas e Conformidade com a Constituição

- **Decision**:
  - Criar `src/components/tasks/my-activities-view.tsx` (visualização) + `src/components/tasks/use-my-activities.ts` (hook de estado, filtros, ordenação e mutação) + `src/components/tasks/my-activities-kpis.tsx` (cards de KPIs com `tv()`).
  - Usar seleção direta de status via `<Select>` acessível ou botões/dropdown rápido na linha (com target mínimo de 44px em mobile) e encapsular ações secundárias (ex: "Ver detalhes", "Marcar como A fazer/Em andamento/Concluída/Cancelada") no menu de engrenagem `<DropdownMenu>` (`Settings`) conforme Constituição V.
  - Aplicar paginação universal fixa de `10` itens por página (`pageSize: 10`) com os 4 botões de navegação padrão (`ChevronsLeft`, `ChevronLeft`, `ChevronRight`, `ChevronsRight`).
- **Rationale**: Garante conformidade integral com os princípios I, II, IV e V da Constituição, mantendo componentes enxutos (< 150 linhas cada), tipagem estrita sem `any` e tokens semânticos do Design System.
