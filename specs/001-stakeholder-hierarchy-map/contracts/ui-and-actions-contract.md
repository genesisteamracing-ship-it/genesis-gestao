# Phase 1 Contracts: Contratos de UI, Hooks e Server Actions

**Feature**: `001-stakeholder-hierarchy-map`  
**Date**: 2026-11-03

## 1. Contrato de Server Actions (`src/actions/communication-actions.ts`)

### `createStakeholderAction(input: CreateStakeholderInput)`
- **Entrada validada por Zod (`createStakeholderSchema`)**:
  ```ts
  {
    name: string;               // Obrigatório (min 2 chars), ex: "Diretoria", "Técnicos", "Professores"
    organization?: string | null; // Nome do Parceiro (ex: "SESI")
    roleOrJobTitle?: string | null;
    group: StakeholderGroup;
    sponsorId?: string | null;
    parentStakeholderId?: string | null; // Opcional: ID do stakeholder superior no mesmo parceiro
    email?: string | null;
    phone?: string | null;
    power: "LOW" | "HIGH";
    interest: "LOW" | "HIGH";
    currentEngagement: EngagementLevel;
    targetEngagement: EngagementLevel;
    preferredChannel: CommunicationChannel;
    preferredFrequency: CommunicationFrequency;
    notes?: string | null;
  }
  ```
- **Comportamento & Pós-Condição**:
  - Verifica autenticação e permissão RBAC (`role !== "AUDITOR"`).
  - Se `sponsorId` for informado e `organization` estiver vazio, resolve o nome do patrocinador como `organization`.
  - Persiste no banco de dados isolado por `teamId`.
  - Executa `revalidatePath("/comunicacao")` para atualizar imediatamente a árvore do Mapa Organizacional.

### `updateStakeholderHierarchyAction(input: { stakeholderId: string; power: StakeholderPower; interest: StakeholderInterest; parentStakeholderId?: string | null; organization?: string | null })`
- Permite reposicionar rapidamente um stakeholder na hierarquia do parceiro (alterando seu nível de Poder/Interesse ou superior direto) a partir do painel de inspeção do nó.

---

## 2. Contrato de Construção da Árvore (`src/lib/communication-hierarchy.ts`)

```ts
export function computeHierarchyTier(
  power: StakeholderPower,
  interest: StakeholderInterest
): { tier: HierarchyTier; rankWeight: 4 | 3 | 2 | 1; label: string };

export function buildStakeholderHierarchyTree(params: {
  teamName: string;
  stakeholders: StakeholderWithRelations[];
  searchQuery?: string;
  partnerFilter?: string; // "ALL" ou partnerKey
}): StakeholderOrgMapTree;
```

### Garantias Determinísticas de `buildStakeholderHierarchyTree`:
1. **Agrupamento por Parceiro**: Todos os stakeholders com mesma `organization` (case-insensitive, trimmed, ex: `"SESI"` e `"sesi"`) ou mesmo `sponsorId` são consolidados em um único `OrgMapPartnerBranch`.
2. **Encadeamento Vertical por Nível de Poder e Interesse**:
   - Para um parceiro com stakeholders em múltiplos níveis de `rankWeight` (ex: `Diretoria` com peso 4, `Técnicos` com peso 2 e `Professores` com peso 1) sem `parentStakeholderId` explícito:
   - O(s) stakeholder(s) do maior peso formam o nível 1 abaixo do Parceiro (`SESI` → `Diretoria`).
   - O(s) stakeholder(s) do próximo peso presente conectam-se diretamente abaixo do nível anterior (`Diretoria` → `Técnicos`).
   - O(s) stakeholder(s) do peso seguinte conectam-se abaixo deste (`Técnicos` → `Professores`).
3. **Subordinação Explícita**:
   - Se um stakeholder possuir `parentStakeholderId` apontando para outro stakeholder válido dentro do mesmo parceiro, ele é anexado diretamente em `parent.children` (com proteção contra ciclos).
4. **Cartões de Planos/Ações (`actionCards`)**:
   - Cada stakeholder recebe seus `plans` ativos (ou um cartão sintético de acompanhamento baseado em `preferredChannel` e `preferredFrequency` caso ainda não possua plano formal cadastrado) para exibição na base da ramificação.

---

## 3. Contrato de Componentes Frontend (`src/components/communication/org-map/`)

Todos os componentes obedecem às regras do `AGENTS.md`:
- Estilização com `tailwind-variants` (`tv`) definida fora do componente e tipada com `VariantProps`.
- Zero cores hardcoded (uso exclusivo de tokens semânticos: `bg-background`, `bg-card`, `border-border`, `text-primary`, `text-purple`, `text-success`, `text-warning`, `text-amber`, `text-muted-foreground`).
- Limite máximo de 150 linhas por componente visual.

| Componente / Hook | Responsabilidade Única (SRP) |
|-------------------|------------------------------|
| `useStakeholderOrgMap` (`src/hooks/use-stakeholder-org-map.ts`) | Gerencia estado de filtro de parceiro (`ALL` vs parceiro único), sub-modo do mapa (`hierarchy`, `structure`, `relations`), busca textual, nível de zoom, nós colapsados e stakeholder selecionado para inspeção ou adição de subordinado. |
| `StakeholderOrgMap` (`org-map/stakeholder-org-map.tsx`) | Renderiza a moldura estilo "Organization Map" (cabeçalho com métricas de organizações/stakeholders/planos, barra de modos `Hierarquia | Estrutura | Relações`, controles de busca/zoom, viewport da árvore com conectores ortogonais e minimapa). |
| `OrgMapNodeCard` (`org-map/org-map-node-card.tsx`) | Renderiza o cartão individual de nó (Raiz da Equipe, Parceiro/Organização ou Stakeholder) com variantes de cor por nível hierárquico (`purple`, `primary`, `success`, `amber`), indicador de status, contadores e botão rápido `+` para adicionar stakeholder subordinado. |
| `OrgMapPlanCard` (`org-map/org-map-plan-card.tsx`) | Renderiza os cartões de planos/ações de comunicação ("Em Andamento") conectados na base dos stakeholders da árvore com barra de progresso semântica. |
| `StakeholderInspectorDialog` (`org-map/stakeholder-inspector-dialog.tsx`) | Diálogo/gaveta contextual aberto ao clicar em um nó do gráfico, exibindo dados de contato, Gap de Engajamento e ações diretas ("Gerar Relatório", "Novo Plano", "Registrar Disparo", "Novo Subordinado"). |
