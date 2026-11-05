# Data Model: Gerenciamento de Permissões de Acesso por Usuário e Módulo

**Feature**: `003-module-access-permissions`
**Date**: 2026-11-05

## 1. Alterações no Schema Prisma (`stem-erp/prisma/schema.prisma`)

### Modelo `User` (Extensão de Campos de Permissão por Módulo)

```prisma
model User {
  id                     String          @id @default(cuid())
  name                   String
  email                  String          @unique
  passwordHash           String
  role                   UserRole        @default(TEAM_LEAD)
  teamId                 String?
  team                   Team?           @relation(fields: [teamId], references: [id], onDelete: SetNull)
  deliveryGroup          DeliveryGroup?
  jobTitle               String?
  isActive               Boolean         @default(true)

  // Permissões granulares de acesso por módulo (SIM = true / NÃO = false)
  canAccessFinance       Boolean         @default(true)
  canAccessRoi           Boolean         @default(true)
  canAccessCommunication Boolean         @default(true)
  canAccessTeam          Boolean         @default(false)

  failedLoginAttempts    Int             @default(0)
  lockedUntil            DateTime?
  lastLoginAt            DateTime?
  createdById            String?
  sessions               Session[]
  auditLogs              AuthAuditLog[]
  createdAt              DateTime        @default(now())
  updatedAt              DateTime        @updatedAt

  @@index([teamId, role])
}
```

### Enum `AuthEventType` (Auditoria de Alteração de Permissão)

O evento `USER_ROLE_UPDATED` já existente em `AuthEventType` será registrado na tabela `AuthAuditLog` sempre que o administrador alterar uma permissão de módulo (`SIM` / `NÃO`) de um usuário, gravando no campo `details` qual módulo foi alterado (ex: `"Permissão do módulo Financeiro alterada para NÃO"`).

---

## 2. Tipos e DTOs TypeScript (`stem-erp/src/types/auth.ts`)

```typescript
export type SystemModuleKey = "finance" | "roi" | "communication" | "team";

export interface UserModulePermissionsDTO {
  finance: boolean;       // Módulo Financeiro (/dashboard, /planejamento, /lancamentos)
  roi: boolean;           // Módulo ROI & Patrocínio (/roi, /roi/acoes)
  communication: boolean; // Módulo Comunicação (/comunicacao)
  team: boolean;          // Módulo Equipe & Acessos (/equipe, /permissoes)
}
```

### Extensão de `AuthenticatedUserDTO` e `TeamMemberDTO`

Ambos os DTOs (`AuthenticatedUserDTO` e `TeamMemberDTO`) passam a incluir a propriedade:

```typescript
permissions: UserModulePermissionsDTO;
```

---

## 3. Regras de Negócio e Transições de Estado

1. **Padrões Iniciais por `UserRole` na Criação de Usuário**:
   - `SUPER_ADMIN`: `{ finance: true, roi: true, communication: true, team: true }`
   - `FINANCE_MANAGER`: `{ finance: true, roi: true, communication: true, team: false }`
   - `TEAM_LEAD`: `{ finance: true, roi: true, communication: true, team: false }`
   - `AUDITOR`: `{ finance: true, roi: true, communication: true, team: false }`

2. **Invariante de Proteção contra Auto-Bloqueio (Self-Lockout Prevention)**:
   - Se `targetUserId === currentAdminUser.id` e `moduleKey === "team"` e `allowed === false`:
     - A operação é rejeitada com erro de validação: `"Você não pode revogar seu próprio acesso ao módulo de Equipe & Permissões."`

3. **Resolução da Primeira Rota Permitida (`getFirstAllowedRoute`)**:
   - Ordem de prioridade ao redirecionar um usuário que tentou acessar um módulo com permissão `NÃO`:
     1. Se `permissions.finance === true` → `/dashboard`
     2. Senão, se `permissions.roi === true` → `/roi`
     3. Senão, se `permissions.communication === true` → `/comunicacao`
     4. Senão, se `permissions.team === true` → `/equipe`
     5. Caso todos sejam `false` → exibe estado vazio informativo de conta sem módulos liberados.
