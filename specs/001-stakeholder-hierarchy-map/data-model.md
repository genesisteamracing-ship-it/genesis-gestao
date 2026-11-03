# Phase 1 Data Model: Mapa Organizacional e Hierárquico de Stakeholders

**Feature**: `001-stakeholder-hierarchy-map`  
**Date**: 2026-11-03

## 1. Evolução do Modelo Persistente (`prisma/schema.prisma`)

O modelo `Stakeholder` existente já armazena `organization`, `sponsorId`, `power` (`LOW` | `HIGH`), `interest` (`LOW` | `HIGH`), `currentEngagement`, `targetEngagement`, `plans` e `communications`. Para suportar subordinação explícita opcional além da hierarquia automática por Poder e Interesse, adicionamos o auto-relacionamento opcional `parentStakeholderId`:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | `String @id @default(cuid())` | Sim | Identificador único do stakeholder |
| `teamId` | `String` | Sim | Isolamento multitenancy da equipe STEM |
| `sponsorId` | `String?` | Não | Vínculo opcional com patrocinador cadastrado (`Sponsor`) |
| `parentStakeholderId` | `String?` | Não | **Novo**: Vínculo opcional para o stakeholder imediatamente superior dentro do mesmo Parceiro/Organização |
| `name` | `String` | Sim | Nome do stakeholder ou setor (ex: `"Diretoria"`, `"Técnicos"`, `"Professores"`) |
| `organization` | `String?` | Não | Nome do Parceiro/Organização (ex: `"SESI"`, `"SENAI"`, `"Bosch"`) |
| `roleOrJobTitle` | `String?` | Não | Cargo ou função dentro da organização parceira |
| `group` | `StakeholderGroup` | Sim | Categoria institucional (`SPONSORS`, `SCHOOL_LEADERSHIP`, `TECHNICAL_MENTORS`, etc.) |
| `power` | `StakeholderPower` | Sim | Nível de poder sobre o projeto (`HIGH` ou `LOW`) |
| `interest` | `StakeholderInterest` | Sim | Nível de interesse no projeto (`HIGH` ou `LOW`) |
| `currentEngagement` | `EngagementLevel` | Sim | Nível de engajamento atual (`UNAWARE` a `LEADING`) |
| `targetEngagement` | `EngagementLevel` | Sim | Nível de engajamento desejado (`UNAWARE` a `LEADING`) |
| `preferredChannel` | `CommunicationChannel` | Sim | Canal preferencial (`WHATSAPP`, `EMAIL`, `MEETING`, `REPORT_PDF`) |
| `preferredFrequency` | `CommunicationFrequency` | Sim | Frequência planejada (`WEEKLY`, `BIWEEKLY`, `MONTHLY`, etc.) |

### Índices e Regras de Integridade
- `@@index([teamId, organization])`
- `@@index([teamId, parentStakeholderId])`
- `onDelete: SetNull` na relação `parent`: se um nó superior for removido, seus subordinados sobem automaticamente para o nível imediatamente superior na árvore do parceiro sem perda de dados.

---

## 2. Entidades Computadas de Domínio / Visão (`src/types/communication.ts`)

### 2.1 `HierarchyTier` (Nível Hierárquico Derivado de Poder & Interesse)

| Tier | Combinação (`power` + `interest`) | Peso (`rankWeight`) | Rótulo Semântico | Variante Visual (`tv`) | Exemplo do Usuário |
|------|-----------------------------------|---------------------|------------------|------------------------|--------------------|
| `TIER_1_STRATEGIC` | `HIGH` + `HIGH` | `4` | Alto Poder · Alto Interesse | `purple` | `Diretoria` |
| `TIER_2_INSTITUTIONAL` | `HIGH` + `LOW` | `3` | Alto Poder · Baixo Interesse | `primary` | `Conselho / Reitoria` |
| `TIER_3_TACTICAL` | `LOW` + `HIGH` | `2` | Baixo Poder · Alto Interesse | `success` | `Técnicos` |
| `TIER_4_OPERATIONAL` | `LOW` + `LOW` | `1` | Baixo Poder · Baixo Interesse | `amber` | `Professores` |

### 2.2 `OrgMapActionCardDTO` (Cartão de Base / Plano em Andamento)
Representa os cartões de atividade exibidos na base dos stakeholders (equivalente aos cartões `"In Progress"` da referência):
- `id: string`
- `title: string` (Título do `CommunicationPlan` ou assunto do último `CommunicationLog`)
- `statusLabel: string` (Ex: `"Plano Ativo · Quinzenal"` ou `"Disparo Realizado"`)
- `channel: CommunicationChannel`
- `progressPercent: number` (`25` a `100`, calculado a partir do engajamento atual vs. almejado e execução do plano)

### 2.3 `OrgMapStakeholderNode` (Nó Hierárquico Recursivo de Stakeholder)
- `id: string`
- `stakeholder: StakeholderWithRelations`
- `partnerKey: string`
- `partnerName: string`
- `tier: HierarchyTier`
- `rankWeight: number` (`1` a `4`)
- `depth: number`
- `children: OrgMapStakeholderNode[]` (Subordinados diretos ou próximo degrau hierárquico do mesmo parceiro)
- `actionCards: OrgMapActionCardDTO[]` (Planos ativos conectados abaixo do nó)

### 2.4 `OrgMapPartnerBranch` (Ramo de Parceiro / Organização)
- `partnerKey: string` (Chave normalizada, ex: `"sesi"`)
- `partnerName: string` (Nome de exibição, ex: `"SESI"`)
- `sponsorId: string | null`
- `sponsorTier: string | null`
- `totalStakeholders: number`
- `totalActivePlans: number`
- `totalLogs: number`
- `highPowerCount: number`
- `rootNodes: OrgMapStakeholderNode[]` (Raízes da cadeia hierárquica dentro do parceiro, ex: `[Diretoria]`)

### 2.5 `StakeholderOrgMapTree` (Árvore Organizacional Completa da Equipe)
- `teamName: string`
- `totalPartners: number`
- `totalStakeholders: number`
- `totalPlans: number`
- `totalLogs: number`
- `partners: OrgMapPartnerBranch[]`

---

## 3. Regras de Validação (`src/lib/validations/communication.ts`)

1. **`organization` no cadastro de Stakeholder**:
   - Caso o usuário selecione um `sponsorId`, o nome do patrocinador pode preencher automaticamente `organization` se este estiver em branco, garantindo que todo stakeholder de patrocinador pertença ao ramo daquele parceiro.
   - Caso não seja patrocinador, `organization` identifica o Parceiro (ex: `"SESI"`, `"SENAI"`, `"Colégio Alfa"`). Se deixado vazio, o sistema agrupa sob o rótulo do `StakeholderGroup` correspondente.
2. **`parentStakeholderId`**:
   - String opcional/nula (`z.string().optional().nullable()`).
   - Validação de domínio impede que um stakeholder seja pai de si mesmo (`parentStakeholderId !== id`) ou pertença a outra equipe (`teamId`).
