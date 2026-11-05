# Contracts: Server Actions, Schemas Zod & UI Components

**Feature**: `003-module-access-permissions`
**Date**: 2026-11-05

## 1. Schemas de Validação Zod (`stem-erp/src/lib/validations/auth.ts`)

```typescript
export const systemModuleKeySchema = z.enum([
  "finance",
  "roi",
  "communication",
  "team",
]);

export const toggleUserModulePermissionSchema = z.object({
  userId: z.string().min(1, "ID do usuário é obrigatório."),
  moduleKey: systemModuleKeySchema,
  allowed: z.boolean(),
});

export type ToggleUserModulePermissionInput = z.infer<
  typeof toggleUserModulePermissionSchema
>;

export const updateAllUserPermissionsSchema = z.object({
  userId: z.string().min(1, "ID do usuário é obrigatório."),
  finance: z.boolean(),
  roi: z.boolean(),
  communication: z.boolean(),
  team: z.boolean(),
});

export type UpdateAllUserPermissionsInput = z.infer<
  typeof updateAllUserPermissionsSchema
>;
```

---

## 2. Server Actions (`stem-erp/src/actions/auth-actions.ts`)

### `toggleUserModulePermissionAction(input: ToggleUserModulePermissionInput): Promise<ActionResponse<UserModulePermissionsDTO>>`
- **Autorização**: Requer usuário autenticado com acesso administrativo (`role === "SUPER_ADMIN"` ou `permissions.team === true`).
- **Validação**:
  - Valida payload via `toggleUserModulePermissionSchema.safeParse(input)`.
  - Impede que o próprio usuário logado defina `moduleKey === "team"` como `false`.
- **Efeito**:
  - Atualiza a coluna correspondente (`canAccessFinance`, `canAccessRoi`, `canAccessCommunication` ou `canAccessTeam`) no banco.
  - Registra evento em `AuthAuditLog`.
  - Executa `revalidatePath("/permissoes")`, `revalidatePath("/equipe")` e `revalidatePath("/", "layout")`.

### `updateAllUserPermissionsAction(input: UpdateAllUserPermissionsInput): Promise<ActionResponse<UserModulePermissionsDTO>>`
- **Autorização**: Requer acesso administrativo.
- **Efeito**: Permite liberar todos os módulos (`SIM`) ou restringir todos os módulos operacionais (`NÃO`) de um usuário através do menu de engrenagem da linha, respeitando a trava de auto-bloqueio para o próprio administrador.

---

## 3. Contratos de Componentes Frontend

### `<ModulePermissionToggle />` (`stem-erp/src/components/permissions/module-permission-toggle.tsx`)
- **Props**:
  - `moduleKey: SystemModuleKey`
  - `moduleLabel: string` (ex: `"Financeiro"`, `"ROI"`, `"Comunicação"`, `"Equipe & Acessos"`)
  - `userName: string`
  - `allowed: boolean` (`true` = `SIM`, `false` = `NÃO`)
  - `disabled?: boolean`
  - `isLoading?: boolean`
  - `onToggle: (nextAllowed: boolean) => void`
- **Comportamento Visual**:
  - Botão toggle segmentado mostrando claramente **`SIM`** e **`NÃO`** (ex: `Financeiro: [SIM] (NÃO)`), estilizado via `tailwind-variants` (`tv`) exclusivamente com tokens semânticos (`bg-success`, `text-primary-foreground`, `bg-muted`, `text-muted-foreground`, `border-border`).

### `<PermissionsTable />` (`stem-erp/src/components/permissions/permissions-table.tsx`)
- **Regras Obrigatórias**:
  - Tabela responsiva listando cada usuário com as 4 colunas de toggle (`Financeiro`, `ROI`, `Comunicação`, `Equipe & Acessos`).
  - Coluna de ações rápidas por linha encapsulada obrigatoriamente em um único botão de engrenagem (`Settings` com `<DropdownMenu>`), seguindo a Regra 8 do `AGENTS.md`.
