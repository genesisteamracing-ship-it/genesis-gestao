# Contracts: Server Actions & Domain APIs — Gestão de Riscos

**Feature**: `007-gestao-de-riscos` | **Date**: 2026-11-12

Todas as Server Actions residem em `stem-erp/src/actions/risk-actions.ts`, validam sessão via `getCurrentSession()`, verificam permissão no módulo `"risks"`, aplicam isolamento por `teamId` e validam entradas com Zod (`safeParse`). Operações de escrita são negadas para `UserRole.AUDITOR`.

---

## 1. `getRiskModuleData(input)`
Retorna todos os registros de risco/oportunidade da equipe e temporada ativas, juntamente com métricas agregadas para os gráficos e lista de membros para seleção de responsável.

- **Input**: `{ season: string }`
- **Output**:
  ```ts
  {
    success: true;
    data: {
      items: RiskItemDTO[];
      members: TeamMemberOption[];
      summary: {
        total: number;
        risksCount: number;
        opportunitiesCount: number;
        criticalCount: number;
        probabilityDistribution: DistributionSlice[]; // % por Chance (inclui NONE)
        consequenceDistribution: DistributionSlice[]; // % por Consequência (inclui NONE)
      };
    };
  }
  ```

---

## 2. `createRiskItem(input)`
Cria um novo registro de risco ou oportunidade.

- **Input (Zod)**:
  - `season`: string não vazia
  - `entryType`: `"RISK" | "OPPORTUNITY"`
  - `title`: string (3..160 chars)
  - `description`: string opcional
  - `sector`: `DeliveryGroup`
  - `probability`: `RiskProbability`
  - `consequence`: `RiskConsequence`
  - `proactiveStrategy`: string opcional
  - `contingencyPlan`: string opcional
  - `observations`: string opcional
  - `evidenceNotes`: string opcional
  - `evidenceUrl`: string URL válida ou vazia opcional
  - `status`: `RiskLifecycleStatus` (padrão `"IDENTIFIED"`)
  - `ownerUserId`: string opcional
- **Behavior**:
  - Calcula `priorityScore` e `priorityLevel` via função pura `calculateRiskPriority(probability, consequence)`.
  - Revalida `/riscos`.
- **Output**: `{ success: true; data: RiskItemDTO } | { success: false; error: string }`

---

## 3. `updateRiskItem(input)`
Atualiza dados de um risco ou oportunidade existente da mesma equipe.

- **Input (Zod)**: `id` + campos editáveis de `createRiskItem`.
- **Behavior**:
  - Verifica pertencimento à `session.teamId`.
  - Recalcula `priorityScore` e `priorityLevel`.
  - Revalida `/riscos`.
- **Output**: `{ success: true; data: RiskItemDTO } | { success: false; error: string }`

---

## 4. `registerRiskReview(input)`
Registra uma revisão periódica ao longo do ciclo de vida, atualizando probabilidade, consequência, status e evidências do `RiskItem` dentro de uma transação (`prisma.$transaction`).

- **Input (Zod)**:
  - `riskItemId`: string
  - `newProbability`: `RiskProbability`
  - `newConsequence`: `RiskConsequence`
  - `newStatus`: `RiskLifecycleStatus`
  - `notes`: string (3..1000 chars)
  - `evidenceNotes`: string opcional
  - `evidenceUrl`: string URL válida ou vazia opcional
- **Behavior**:
  - Lê estado anterior do `RiskItem` (validando `teamId`).
  - Cria `RiskReview` com snapshot `previous*` e `new*`.
  - Atualiza `RiskItem` com os novos valores, novo `priorityScore`/`priorityLevel` e `evidenceNotes`/`evidenceUrl` (quando informados).
  - Revalida `/riscos`.
- **Output**: `{ success: true; data: { item: RiskItemDTO; review: RiskReviewDTO } } | { success: false; error: string }`

---

## 5. `getRiskReviews(riskItemId)`
Retorna o histórico cronológico de revisões de um `RiskItem` da equipe ativa.

- **Output**: `{ success: true; data: RiskReviewDTO[] } | { success: false; error: string }`

---

## 6. `deleteRiskItem(riskItemId)`
Remove um registro de risco/oportunidade (e suas revisões em cascata) pertencente à equipe ativa.

- **Output**: `{ success: true } | { success: false; error: string }`
