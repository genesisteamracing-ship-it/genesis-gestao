# Interface Contracts: Módulo Documentos & WBS (EAP)

**Feature**: `004-wbs-document-module`  
**Date**: 2026-11-06  
**Status**: Completed

## 1. Esquemas de Validação (Zod Schemas)

### `CreateWbsNodeSchema`
Validação de entrada para criação de novo entregável na WBS:

```typescript
import { z } from "zod";

export const DeliveryGroupEnum = z.enum([
  "ENGINEERING_CAD",
  "MANUFACTURING_CNC",
  "PIT_DISPLAY",
  "MARKETING_SPONSOR",
  "PROJECT_MANAGEMENT",
  "SOCIAL_PROJECT",
]);

export const WbsNodeStatusEnum = z.enum([
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "AUDITED",
]);

export const CreateWbsNodeSchema = z.object({
  teamId: z.string().cuid(),
  parentId: z.string().cuid().nullable().optional(),
  code: z
    .string()
    .min(1, "O código EAP é obrigatório")
    .regex(/^[0-9]+(\.[0-9]+)*$/, "Formato de código inválido (ex: 1.0, 1.2, 1.2.3)"),
  title: z
    .string()
    .min(3, "O título do entregável deve conter pelo menos 3 caracteres")
    .max(120, "O título do entregável não deve exceder 120 caracteres"),
  description: z.string().max(500, "Descrição muito longa").optional().nullable(),
  discipline: DeliveryGroupEnum,
  ownerId: z.string().cuid().optional().nullable(),
  ownerName: z.string().optional().nullable(),
  status: WbsNodeStatusEnum.default("PLANNED"),
  estimatedCostCents: z.coerce
    .number()
    .int("Custo deve ser um número inteiro em centavos")
    .nonnegative("O custo não pode ser negativo")
    .default(0),
  estimatedHours: z.coerce
    .number()
    .int("Horas devem ser números inteiros")
    .nonnegative("Horas não podem ser negativas")
    .default(0),
  sortOrder: z.number().int().default(0),
});

export type CreateWbsNodeInput = z.infer<typeof CreateWbsNodeSchema>;
```

### `UpdateWbsNodeSchema`
Validação de entrada para edição de um entregável existente:

```typescript
export const UpdateWbsNodeSchema = CreateWbsNodeSchema.partial().extend({
  id: z.string().cuid(),
});

export type UpdateWbsNodeInput = z.infer<typeof UpdateWbsNodeSchema>;
```

---

## 2. Server Actions & Services

### `getWbsTreeAction`
Recupera todos os nós da equipe, calcula o roll-up da Regra dos 100% e retorna a árvore estruturada com métricas.

- **Entrada**: `{ teamId?: string }` (se omitido, recupera a equipe ativa da sessão do usuário autenticado).
- **Retorno**:
  ```typescript
  type GetWbsTreeResult = {
    success: boolean;
    data?: {
      tree: WbsTreeNode[];
      metrics: WbsSummaryMetrics;
      members: { id: string; name: string; jobTitle: string | null }[];
    };
    error?: string;
  };
  ```

### `createWbsNodeAction`
Cria um novo entregável ou sub-entregável na árvore.

- **Entrada**: `CreateWbsNodeInput`
- **Retorno**:
  ```typescript
  type CreateWbsNodeResult = {
    success: boolean;
    data?: WbsTreeNode;
    error?: string;
  };
  ```

### `updateWbsNodeAction`
Atualiza dados cadastrais, custo ou responsável de um nó.

- **Entrada**: `UpdateWbsNodeInput`
- **Retorno**:
  ```typescript
  type UpdateWbsNodeResult = {
    success: boolean;
    data?: WbsTreeNode;
    error?: string;
  };
  ```

### `deleteWbsNodeAction`
Remove um nó e seus eventuais sub-entregáveis em cascata.

- **Entrada**: `{ id: string; teamId: string }`
- **Retorno**:
  ```typescript
  type DeleteWbsNodeResult = {
    success: boolean;
    deletedCount?: number;
    error?: string;
  };
  ```

---

## 3. Contratos de Componentes de UI (Frontend)

### `WbsHeaderMetrics`
- **Props**:
  - `metrics: WbsSummaryMetrics`
  - `isLoading?: boolean`

### `WbsTreeTable`
- **Props**:
  - `nodes: WbsTreeNode[]`
  - `isPresentationMode: boolean`
  - `onAddChild: (parent: WbsTreeNode) => void`
  - `onEdit: (node: WbsTreeNode) => void`
  - `onDelete: (node: WbsTreeNode) => void`

### `WbsRowActions`
- **Props**:
  - `node: WbsTreeNode`
  - `onAddChild: () => void`
  - `onEdit: () => void`
  - `onDelete: () => void`
- **Anatomia**: Botão único de engrenagem (`Settings`) acionando `<DropdownMenu>` com `<DropdownMenuContent align="end">`.
