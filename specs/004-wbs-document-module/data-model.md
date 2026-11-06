# Data Model: Módulo Documentos e WBS (EAP)

**Feature**: `004-wbs-document-module`  
**Date**: 2026-11-06  
**Status**: Completed

## 1. Entidades de Banco de Dados (Prisma Schema)

### Modelo: `WbsNode` (Nó da Estrutura Analítica do Projeto / Entregável)
Representa cada item e subsistema na decomposição hierárquica do escopo total da escuderia.

```prisma
enum WbsNodeStatus {
  PLANNED      // Planejado no escopo inicial
  IN_PROGRESS  // Em construção / execução
  COMPLETED    // Entregável finalizado
  AUDITED      // Validado perante banca de escrutínio / PM
}

model WbsNode {
  id                 String         @id @default(cuid())
  teamId             String
  team               Team           @relation(fields: [teamId], references: [id], onDelete: Cascade)
  parentId           String?
  parent             WbsNode?       @relation("WbsHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children           WbsNode[]      @relation("WbsHierarchy")
  
  code               String         // Código EAP (ex: "1.0", "1.2", "1.2.3")
  title              String         // Nome do Entregável
  description        String?        // Descrição do escopo específico ("o que precisa ser construído")
  discipline         DeliveryGroup  // Setor: Engenharia, Manufatura, Pit Display, Marketing, Gestão, Social
  
  ownerId            String?
  owner              User?          @relation(fields: [ownerId], references: [id], onDelete: SetNull)
  ownerName          String?        // Nome em cache do responsável técnico para listagens rápidas
  
  status             WbsNodeStatus  @default(PLANNED)
  estimatedCostCents Int            @default(0) // Custo direto de fabricação em centavos (folhas)
  estimatedHours     Int            @default(0) // Esforço direto estimado em horas (folhas)
  
  sortOrder          Int            @default(0) // Ordem de apresentação entre nós irmãos
  depth              Int            @default(1) // 1 = Raiz/Projeto, 2 = Subsistema, 3 = Pacote de Trabalho
  
  createdAt          DateTime       @default(now())
  updatedAt          DateTime       @updatedAt

  @@unique([teamId, code])
  @@index([teamId, parentId])
  @@index([teamId, discipline])
  @@index([teamId, depth])
}
```

### Extensão do Modelo `User`:
Inclusão do campo booleano de acesso ao módulo de documentos:
```prisma
model User {
  // ... campos existentes ...
  canAccessDocuments Boolean @default(true)
  wbsNodes           WbsNode[]
}
```

---

## 2. Tipos e Entidades de Domínio (TypeScript / Application Layer)

### `WbsTreeNode` (Árvore Enriquecida para Interface e Apresentação)
```typescript
export interface WbsTreeNode {
  id: string;
  teamId: string;
  parentId: string | null;
  code: string;
  title: string;
  description: string | null;
  discipline: DeliveryGroup;
  ownerId: string | null;
  ownerName: string | null;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "AUDITED";
  estimatedCostCents: number; // Custo próprio informado (se folha)
  estimatedHours: number;     // Horas próprias informadas (se folha)
  rolledUpCostCents: number;  // Soma recursiva calculada (Regra dos 100%)
  rolledUpHours: number;      // Horas recursivas calculadas (Regra dos 100%)
  depth: number;
  isLeaf: boolean;
  children: WbsTreeNode[];
}
```

### `WbsSummaryMetrics` (Métricas de Resumo do Topo da Página)
```typescript
export interface WbsSummaryMetrics {
  totalDeliverables: number;
  totalWorkPackages: number;     // Apenas nós folha (nível mínimo controlável)
  totalRollupCostCents: number;   // Custo total consolidado da temporada
  totalRollupHours: number;       // Esforço total consolidado em horas
  completedDeliverables: number;
  disciplineCounts: Record<string, number>;
}
```

---

## 3. Regras de Validação & Transição de Estado

1. **Unicidade de Código por Equipe**: Não podem existir dois entregáveis com o mesmo `code` na mesma equipe.
2. **Integridade de Hierarquia**:
   - Um nó de Nível 1 (`depth: 1`) não possui `parentId`.
   - Um nó de Nível 2+ deve obrigatoriamente possuir um `parentId` válido pertencente à mesma `teamId`.
   - A exclusão de um nó pai acarreta a exclusão em cascata de todos os seus nós descendentes, com diálogo de confirmação explícito.
3. **Regra dos 100% (Roll-up)**:
   - Se `children.length === 0`: `rolledUpCostCents = estimatedCostCents` e `rolledUpHours = estimatedHours`.
   - Se `children.length > 0`: `rolledUpCostCents = sum(children.rolledUpCostCents)` e `rolledUpHours = sum(children.rolledUpHours)`.
4. **Validação de Responsável**:
   - Todo nó folha (*work package*) deve ter um responsável técnico atribuído para evitar ambiguidade de escopo.
