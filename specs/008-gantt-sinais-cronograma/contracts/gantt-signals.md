# Interface & Action Contracts: Sinais de Status, Linha de Base e Caminho Crítico no Gantt

**Feature**: `008-gantt-sinais-cronograma` | **Date**: 2026-11-27

## 1. Validação Zod (`stem-erp/src/lib/validations/tasks.ts`)

### `createTaskSchema`
Estende o contrato existente mantendo retrocompatibilidade:
- `teamId`: string não vazia
- `title`: string trim `1..160`
- `description`: string opcional `<= 4000`
- `deliveryGroup`: `DeliveryGroup`
- `startDate`: data `YYYY-MM-DD` válida (início planejado / linha de base inicial)
- `endDate`: data `YYYY-MM-DD` válida (`>= startDate`)
- `isAtRisk`: boolean opcional (padrão `false`)
- `isCritical`: boolean opcional (padrão `false`)
- `assignments`: array R/C/I sem duplicatas

### `editTaskSchema`
Estende `createTaskSchema` com:
- `id`: string não vazia
- `revision`: inteiro `>= 0` (controle otimista de concorrência)
- `status`: `TaskStatus`
- `baselineStartDate`: data `YYYY-MM-DD` válida (opcional — quando omitida, preserva a linha de base atual)
- `baselineEndDate`: data `YYYY-MM-DD` válida (opcional — quando presente, exige `baselineStartDate <= baselineEndDate`)

### `rescheduleTaskSchema`
Permanece com a mesma assinatura externa (`teamId`, `taskId`, `startDate`, `endDate`, `revision`), mas o serviço garante preservação automática de `baselineStartDate`/`baselineEndDate`.

## 2. Server Actions (`stem-erp/src/actions/tasks.actions.ts`)

| Action | Permissão exigida | Efeito |
| --- | --- | --- |
| `createTaskAction(input)` | Editor no módulo `TASKS` da equipe ativa | Cria tarefa gravando `baselineStartDate = startDate`, `baselineEndDate = endDate`, `isAtRisk`, `isCritical` e revalida `/tarefas`. |
| `editTaskAction(input)` | Editor no módulo `TASKS` da equipe ativa | Atualiza datas atuais, linha de base (se alterada), `status`, `isAtRisk`, `isCritical` com checagem otimista de `revision`. |
| `rescheduleTaskAction(input)` | Editor no módulo `TASKS` da equipe ativa | Atualiza `startDate`/`endDate` mantendo linha de base intacta para evidenciar o desvio no Gantt. |

Perfil `AUDITOR` continua bloqueado em todas as mutações com resposta `{ ok: false, message }`.

## 3. Contratos de Componentes de UI

### `TaskGanttKpis` (`stem-erp/src/components/tasks/task-gantt-kpis.tsx`)
- **Props**: `{ summary: GanttSummary; className?: string }`
- **Renderiza**: Grade responsiva (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`) com 4 cards usando tokens semânticos:
  1. `Progresso geral`: valor `${summary.progressPercent}%` + barra de progresso (`role="progressbar"`, `aria-valuenow`, `aria-valuemin={0}`, `aria-valuemax={100}`).
  2. `Atividades críticas`: valor `${summary.criticalCount}`.
  3. `Desvio atual`: valor formatado (`+N dias`, `0 dias`, `-N dias`), com destaque `text-destructive` quando `> 0` e `text-success` quando `<= 0`.
  4. `Marco final`: pílula semântica com `summary.milestoneLabel` (`No prazo`, `Sob atenção`, `Em atraso`, `Concluído`).

### `TaskGanttLegend` (`stem-erp/src/components/tasks/task-gantt-legend.tsx`)
- **Props**: `{ className?: string }`
- **Renderiza**: Card/painel "Legenda (status)" com os 5 itens exatos da especificação:
  1. Verde — `em dia (dentro do planejado)`
  2. Amarelo — `atenção (risco de atraso)`
  3. Vermelho — `atraso (fora do planejado)`
  4. Cinza — `linha de base (planejado)`
  5. Losango vermelho (`◇`) — `Caminho crítico (define o prazo final)`

### `TaskGantt` (`stem-erp/src/components/tasks/task-gantt.tsx`)
- Renderiza `TaskGanttKpis` no topo da visão Gantt.
- Coluna esquerda estruturada em duas subcolunas alinhadas: `ID` (`A`, `B`, `C`, `D`...) e `Atividade`.
- Cada linha exibe:
  - Barra cinza de linha de base (`baselineStartDate..baselineEndDate`) na faixa superior;
  - Barra colorida de execução (`startDate..endDate`) sobreposta/pareada com cor semântica (`ON_TRACK` verde, `AT_RISK` amarelo, `DELAYED` vermelho, `COMPLETED` verde escuro com ícone ✓);
  - Quando crítica (`isCritical`): contorno vermelho arredondado envolvendo a linha (`border-destructive`), losango vermelho (`◇`) na ponta direita da barra e rótulo `"Crítica"`;
  - Rótulo de status (`Atrasada`, `Em dia`, `Atenção`, `Concluída`) posicionado à direita da barra;
- Exibe `TaskGanttLegend` integrada ao layout do Gantt (ao lado direito em desktop largo `xl:` ou logo abaixo/acima de forma fluida em telas menores).

### `TaskForm` (`stem-erp/src/components/tasks/task-form.tsx`)
- Na **criação**: mantém formulário limpo com Início/Término Planejados (que viram Linha de Base automaticamente) + toggles opcionais `Risco de atraso (Atenção)` e `Atividade crítica`.
- Na **edição**: exibe datas **Atuais / Previstas** e bloco de **Linha de Base (Planejado)** com labels nivelados conforme Regra 13 (`min-h-[2rem] flex items-end`), além dos toggles `Risco de atraso` e `Atividade crítica`.
