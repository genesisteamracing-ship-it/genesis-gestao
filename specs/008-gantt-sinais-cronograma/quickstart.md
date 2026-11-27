# Quickstart & Validation Guide: Sinais de Status, Linha de Base e Caminho Crítico no Gantt

**Feature**: `008-gantt-sinais-cronograma` | **Date**: 2026-11-27

## 1. Pré-requisitos e Banco de Dados Seguro

Antes de qualquer alteração no schema Prisma (`stem-erp/prisma/schema.prisma`), seguir obrigatoriamente a Regra 12 (Zero Reset):

```powershell
cd stem-erp
npm run db:backup
npm run db:safe-push
```

> Nunca utilizar `--force-reset`, `--accept-data-loss` ou `migrate reset`.

## 2. Validação Automatizada (Quality Gates)

Executar dentro de `stem-erp/`:

```powershell
npx tsc --noEmit
npm run lint
npm test
```

### Cobertura mínima esperada nos testes
1. **Unitários (`src/lib/__tests__/task-gantt-metrics.test.ts`)**:
   - Geração de IDs curtos (`A..Z`, `AA`, `AB`).
   - Classificação semafórica: `ON_TRACK`, `AT_RISK` (≤ 2 dias, ≥ 80% decorrido e flag manual), `DELAYED` (ultrapassou baseline ou data atual), `COMPLETED` e `CANCELLED`.
   - Cálculo CPM (cadeia simples, ramificação com folga, múltiplas tarefas críticas, combinação com flag manual `isCritical`).
   - Cálculo dos 4 KPIs (`progressPercent`, `criticalCount`, `deviationDays`, `milestoneStatus`) incluindo lista vazia e tarefas canceladas.
2. **Validação Zod (`src/lib/validations/__tests__/tasks-validation.test.ts`)**:
   - Rejeição de `baselineEndDate < baselineStartDate` e `endDate < startDate`.
   - Aceitação de `isAtRisk` e `isCritical`.
3. **Componentes (`src/components/tasks/__tests__/task-gantt-signals.test.tsx`)**:
   - Renderização dos 4 cards (`Progresso geral`, `Atividades críticas`, `Desvio atual`, `Marco final`) com atributos acessíveis (`progressbar`).
   - Renderização da coluna `ID` + `Atividade`, barras de linha de base e execução, rótulos textuais (`Atrasada`, `Em dia`, `Concluída`, `Crítica`), ícone ✓, losango `◇` e os 5 itens da `Legenda (status)`.
4. **E2E (`e2e/tarefas-gantt-sinais.spec.ts`)**:
   - Fluxo desktop (`1280x720`) e mobile (`375x667`): criar tarefa, reprogramar para gerar desvio, marcar crítica/concluída, validar os 4 cards e a legenda.

## 3. Verificação Manual Ponta a Ponta

1. Iniciar o servidor local em `stem-erp/`: `npm run dev`.
2. Acessar `/tarefas` e abrir a aba **Gantt**.
3. Criar 4 atividades simulando a referência do avaliador:
   - `A — Projeto CAD`: reprogramar término para depois da linha de base → verificar barra cinza + barra vermelha + rótulo **Atrasada**.
   - `B — Fabricação`: em andamento dentro da linha de base → verificar barra cinza + barra verde + rótulo **Em dia**.
   - `C — Montagem`: marcar como **Concluída** → verificar barra cinza + barra verde escuro + ícone ✓ + rótulo **Concluída**.
   - `D — Testes`: marcar em atenção/risco e crítica (ou vincular como entrega final crítica) → verificar contorno vermelho na linha, barra amarela, losango vermelho `◇` e rótulo **Crítica**.
4. Conferir os 4 cards no topo (**Progresso geral**, **Atividades críticas**, **Desvio atual**, **Marco final**) e a **Legenda (status)**.
5. Testar alternância de filtro por setor e verificar atualização imediata dos 4 cards e da grade.
6. Validar com perfil `AUDITOR` que todos os sinais aparecem em modo somente leitura.
