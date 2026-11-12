# Data Model: Módulo de Gestão de Riscos e Oportunidades

**Feature**: `007-gestao-de-riscos` | **Date**: 2026-11-12

## Enums (Prisma)

### `RiskEntryType`
- `RISK` — Risco (ameaça / evento negativo)
- `OPPORTUNITY` — Oportunidade (evento positivo / ganho potencial)

### `RiskProbability`
- `QUASE_CERTO` — Quase certo (peso 5)
- `PROVAVEL` — Provável (peso 4)
- `POSSIVEL` — Possível (peso 3)
- `IMPROVAVEL` — Improvável (peso 2)
- `RARA` — Rara (peso 1)
- `NONE` — None / Não definida (peso 0)

### `RiskConsequence`
- `CATASTROFICA` — Catastrófica (peso 5)
- `GRANDE` — Grande (peso 4)
- `MODERADA` — Moderada (peso 3)
- `PEQUENA` — Pequena (peso 2)
- `DESPREZIVEL` — Desprezível (peso 1)
- `NONE` — None / Não definida (peso 0)

### `RiskLifecycleStatus`
- `IDENTIFIED` — Identificado
- `MONITORING` — Em monitoramento
- `MITIGATED` — Mitigado / Controlado
- `OCCURRED` — Ocorrido / Realizado
- `CLOSED` — Encerrado

### `RiskPriorityLevel` (calculado em domínio / persistido para indexação e ordenação)
- `CRITICAL` — Crítico (`score >= 15`)
- `HIGH` — Alto (`9 <= score < 15`)
- `MEDIUM` — Médio (`4 <= score < 9`)
- `LOW` — Baixo (`1 <= score < 4`)
- `UNASSESSED` — Não avaliado (`probability == NONE` ou `consequence == NONE`)

---

## Entities

### `RiskItem`
Representa um risco ou oportunidade registrado por uma equipe em uma temporada.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `String` (`cuid`) | Sim | Identificador único |
| `teamId` | `String` | Sim | Referência à equipe (`Team`) para isolamento multitenant |
| `season` | `String` | Sim | Temporada ativa (ex.: `"2026"`) |
| `entryType` | `RiskEntryType` | Sim | `RISK` (padrão) ou `OPPORTUNITY` |
| `title` | `String` | Sim | Nome / identificação do risco ou oportunidade |
| `description` | `String?` | Não | Detalhamento, causa raiz e gatilhos |
| `sector` | `DeliveryGroup` | Sim | Setor responsável (`ENGINEERING_CAD`, `MANUFACTURING_CNC`, etc.) |
| `probability` | `RiskProbability` | Sim | Chance de acontecer (`NONE` padrão se não avaliada) |
| `consequence` | `RiskConsequence` | Sim | Impacto caso aconteça (`NONE` padrão se não avaliada) |
| `priorityScore` | `Int` | Sim | Pontuação calculada (`0..25`) |
| `priorityLevel` | `RiskPriorityLevel` | Sim | Nível calculado (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `UNASSESSED`) |
| `proactiveStrategy` | `String?` | Não | Estratégia proativa implementada |
| `contingencyPlan` | `String?` | Não | Plano de contingência (ou plano de aproveitamento para oportunidades) |
| `observations` | `String?` | Não | Observações exibidas na tabela principal |
| `evidenceNotes` | `String?` | Não | Evidências de gestão do risco ou oportunidade |
| `evidenceUrl` | `String?` | Não | Link opcional para documento/evidência externa |
| `status` | `RiskLifecycleStatus` | Sim | Estado no ciclo de vida (`IDENTIFIED` padrão) |
| `ownerName` | `String?` | Não | Nome do responsável pelo acompanhamento |
| `ownerUserId` | `String?` | Não | Referência opcional ao `User` responsável |
| `createdByUserId` | `String?` | Não | Autor da criação (`User`) |
| `createdAt` | `DateTime` | Sim | Data de criação |
| `updatedAt` | `DateTime` | Sim | Data da última atualização |

**Índices e Restrições**:
- `@@index([teamId, season])`
- `@@index([teamId, sector])`
- `@@index([teamId, priorityScore])`

---

### `RiskReview`
Representa uma revisão periódica realizada ao longo do ciclo de vida de um `RiskItem`.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `String` (`cuid`) | Sim | Identificador único |
| `riskItemId` | `String` | Sim | Referência ao `RiskItem` (`onDelete: Cascade`) |
| `teamId` | `String` | Sim | Redundância para validação multitenant |
| `previousProbability` | `RiskProbability` | Sim | Probabilidade antes da revisão |
| `newProbability` | `RiskProbability` | Sim | Probabilidade após a revisão |
| `previousConsequence` | `RiskConsequence` | Sim | Consequência antes da revisão |
| `newConsequence` | `RiskConsequence` | Sim | Consequência após a revisão |
| `previousStatus` | `RiskLifecycleStatus` | Sim | Status antes da revisão |
| `newStatus` | `RiskLifecycleStatus` | Sim | Status após a revisão |
| `notes` | `String` | Sim | Parecer / justificativa da revisão |
| `evidenceNotes` | `String?` | Não | Evidência coletada na revisão |
| `evidenceUrl` | `String?` | Não | Link de evidência da revisão |
| `reviewerName` | `String` | Sim | Nome de quem realizou a revisão |
| `reviewerUserId` | `String?` | Não | Referência opcional ao `User` revisor |
| `reviewedAt` | `DateTime` | Sim | Data/hora da revisão (`default(now())`) |

**Índices**:
- `@@index([riskItemId, reviewedAt])`
- `@@index([teamId])`

---

## State Transitions (`RiskLifecycleStatus`)
- `IDENTIFIED` → `MONITORING` | `MITIGATED` | `OCCURRED` | `CLOSED`
- `MONITORING` → `MITIGATED` | `OCCURRED` | `CLOSED`
- `MITIGATED` → `MONITORING` | `OCCURRED` | `CLOSED`
- `OCCURRED` → `MITIGATED` | `CLOSED`
- `CLOSED` → `MONITORING` (reabertura via revisão)
