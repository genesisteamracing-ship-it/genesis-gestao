# Research & Architectural Decisions: Sinais de Status, Linha de Base e Caminho Crítico no Gantt

**Feature**: `008-gantt-sinais-cronograma` | **Date**: 2026-11-27

## 1. Modelo de Linha de Base (Baseline) vs. Datas de Execução

- **Decision**: Adicionar campos opcionais `baselineStartDate DateTime? @db.Date` e `baselineEndDate DateTime? @db.Date` no modelo `Task` do Prisma. Ao criar uma tarefa (`createTask`), gravar `baselineStartDate = startDate` e `baselineEndDate = endDate` automaticamente. Ao reprogramar a tarefa via resize no Gantt (`rescheduleTask`) ou editar `startDate`/`endDate` em `editTask`, preservar `baselineStartDate`/`baselineEndDate` inalterados (permitindo edição explícita da linha de base apenas quando o editor alterar os campos de Linha de Base no formulário). Para tarefas legadas com `baselineStartDate/EndDate` nulos, a camada de domínio faz fallback transparente para `startDate/endDate`.
- **Rationale**: Totalmente aditivo e não-destrutivo no PostgreSQL (zero risco de perda de dados para tarefas existentes da Equipe Gênesis), zero fricção no cadastro inicial (o usuário continua informando apenas um par de datas ao criar) e imediata evidência visual de desvio ao reprogramar uma tarefa no Gantt ou no formulário.
- **Alternatives considered**:
  - *Snapshot global manual de linha de base em tabela separada*: Mais complexo para o usuário lembrar de "congelar" o cronograma e aumenta o escopo de migração sem ganho proporcional para avaliação acadêmica/STEM.
  - *Exigir dois pares de datas obrigatórios na criação*: Aumenta fricção no cadastro de novas tarefas quando planejado e atual ainda são idênticos.

## 2. Regra de Classificação Semafórica (Verde, Amarelo, Vermelho, Concluída)

- **Decision**: Implementar função pura determinística `evaluateTaskScheduleSignal(task, todayIso)` em `src/lib/task-gantt-metrics.ts` (sem efeitos colaterais, 100% testável):
  1. Se `status === "CANCELLED"` → `CANCELLED` (neutro, fora das métricas).
  2. Se `status === "DONE"` → `COMPLETED` (verde escuro + ícone ✓ + rótulo `"Concluída"`).
  3. Se `endDate > baselineEnd` **ou** `todayIso > baselineEnd` → `DELAYED` (vermelho + rótulo `"Atrasada"`).
  4. Se `task.isAtRisk === true` **ou** dias restantes até `baselineEnd` ≤ 2 **ou** progresso de tempo decorrido `(today - baselineStart) / (baselineEnd - baselineStart) >= 0.8` → `AT_RISK` (amarelo + rótulo `"Atenção"`).
  5. Caso contrário → `ON_TRACK` (verde + rótulo `"Em dia"`).
- **Rationale**: Combina automação objetiva de gestão de projetos com controle explícito do gestor (`isAtRisk`) para registrar riscos antes mesmo de faltar 2 dias, garantindo que qualquer cenário apresentado pelo avaliador possa ser demonstrado com fidelidade.
- **Alternatives considered**:
  - *Apenas automático*: Não permite sinalizar risco antecipado em tarefas longas com gargalo conhecido.
  - *Apenas manual*: Corre o risco de tarefas vencidas não ficarem vermelhas automaticamente.

## 3. Cálculo do Caminho Crítico (CPM + Override Manual)

- **Decision**: Implementar função pura `computeCriticalPathIds(tasks, edges)` em `src/lib/task-gantt-metrics.ts` usando Forward Pass / Backward Pass (CPM clássico sobre grafo acíclico de tarefas não canceladas):
  - Cada tarefa tem duração inclusiva `duration = endDay - startDay + 1`.
  - Forward pass calcula `ES` (Early Start) e `EF` (Early Finish) respeitando as datas da tarefa e suas predecessoras (`ES >= max(predecessor.EF + 1)`).
  - `projectFinish = max(EF)` entre todas as tarefas ativas.
  - Backward pass calcula `LF` (Late Finish) e `LS` (Late Start) a partir de `projectFinish`.
  - Tarefas com folga total `slack = LS - ES === 0` (ou que definem `projectFinish` quando não há dependências) entram no conjunto crítico, **somado** às tarefas com `task.isCritical === true` (flag manual opcional no formulário).
- **Rationale**: Atende tanto cronogramas com rede de dependências (CPM rigoroso de gestão de projetos) quanto cronogramas simples onde o gestor quer destacar manualmente uma entrega crítica para a banca. Como `TaskDependency` já bloqueia ciclos (`createsCycle`), o grafo é garantidamente um DAG.
- **Alternatives considered**:
  - *Apenas flag manual*: Não recalcula automaticamente quando uma dependência ou data muda.
  - *Apenas CPM sem flag manual*: Em cronogramas onde a equipe ainda não ligou todas as setas de dependência, todas as tarefas poderiam ficar com folga arbitrária ou apenas a última tarefa seria crítica.

## 4. Cálculo dos 4 Cards Executivos do Gantt

- **Decision**: Implementar função pura `computeGanttSummary(tasks, edges, todayIso)` em `src/lib/task-gantt-metrics.ts` operando sobre as tarefas visíveis (respeitando o filtro de setor ativo) excluindo `CANCELLED`:
  - **Progresso geral (`progressPercent`)**: Média ponderada por estado (`DONE = 100%`, `IN_PROGRESS = 50%` ou fração de conclusão; se preferirmos simplicidade auditável, `Math.round((doneCount / activeCount) * 100)` ou média de pesos — optamos por **`Math.round((doneCount / activeCount) * 100)`** quando só existem estados discretos, ou ponderado com `IN_PROGRESS = 50%`? Melhor: `DONE = 100%`, `IN_PROGRESS = 50%`, `TODO = 0%` arredondado, pois evita exibir `0%` quando metade do projeto está em andamento, e chega a `100%` somente quando todas estão concluídas).
  - **Atividades críticas (`criticalCount`)**: Quantidade de tarefas ativas visíveis no conjunto `criticalIds`.
  - **Desvio atual (`deviationDays`)**: Diferença em dias entre o maior término efetivo/atual (`max(endDate, todayIso se atrasada não concluída)`) e o maior término da linha de base (`max(baselineEndDate)`). Exibido como `+N dias` (atraso), `0 dias` (no prazo) ou `-N dias` (adiantado).
  - **Marco final (`milestoneStatus`)**:
    - Todas as tarefas ativas concluídas → `COMPLETED` (`"Concluído"`);
    - `deviationDays > 0` ou qualquer atividade crítica em `DELAYED` → `DELAYED` (`"Em atraso"`);
    - Qualquer atividade crítica em `AT_RISK` ou pelo menos uma tarefa atrasada não crítica → `AT_RISK` (`"Sob atenção"`);
    - Caso contrário → `ON_TRACK` (`"No prazo"`).
- **Rationale**: Cálculos transparentes, 100% determinísticos e imediatamente reativos a qualquer filtro de setor ou mutação de tarefa.

## 5. Tokens Semânticos e Modularização do `TaskGantt`

- **Decision**:
  - Usar exclusivamente tokens semânticos do tema (`bg-success`, `text-success`, `bg-warning`, `text-warning`, `bg-destructive`, `text-destructive`, `bg-muted`, `border-border`, `bg-card`) com `tailwind-variants` (`tv`). Zero cores hexadecimais ou arbitrárias.
  - Extrair subcomponentes coesos para evitar inflar `task-gantt.tsx`:
    - `src/components/tasks/task-gantt-kpis.tsx` (os 4 cards executivos no topo)
    - `src/components/tasks/task-gantt-legend.tsx` (legenda de status com os 5 sinais)
    - `src/lib/task-gantt-metrics.ts` (geração de ID curto `A..Z, AA..`, semáforo, CPM e resumo dos 4 cards)
- **Rationale**: Alinha-se rigorosamente aos Princípios I (SOLID / componentes pequenos) e II (Design System Semântico + `tv`) da Constituição.
