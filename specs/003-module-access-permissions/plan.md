# Implementation Plan: Gerenciamento de Permissões de Acesso por Usuário e Módulo

**Branch**: `003-module-access-permissions` | **Date**: 2026-11-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-module-access-permissions/spec.md`

## Summary

Implementar uma tela dedicada de **Permissões de Acesso (`/permissoes`)** integrada ao módulo **Equipe & Acessos**, permitindo configurar individualmente o acesso de cada usuário aos 4 módulos principais do sistema (**Financeiro**, **ROI & Patrocínio**, **Comunicação** e **Equipe & Acessos**) por meio de botões alternadores (*toggle buttons*) com indicação visual explícita de **`SIM`** e **`NÃO`**. As permissões são persistidas no modelo `User` via Prisma/PostgreSQL, refletidas dinamicamente no menu lateral (`AppSidebar` e `MobileNavDrawer`) e aplicadas nas guardas de rota server-side, com proteção contra auto-bloqueio administrativo.

## Technical Context

**Language/Version**: TypeScript 5.x (Strict Mode, zero `any`)

**Primary Dependencies**: Next.js 16 (App Router, React Server Components, Server Actions), React 19, Prisma ORM 6, Tailwind CSS v4, `tailwind-variants` (`tv`), `shadcn/ui` (Radix UI primitives), `zod`, `lucide-react`, `sonner`

**Storage**: PostgreSQL (Neon Serverless) via Prisma ORM — 4 colunas booleanas em `User` (`canAccessFinance`, `canAccessRoi`, `canAccessCommunication`, `canAccessTeam`)

**Testing**: Node.js Test Runner via `tsx --test` (`npm --prefix stem-erp test`)

**Target Platform**: Web Application Responsiva (Mobile-First `320px+` até Desktop `1600px`)

**Project Type**: Fullstack Web Application (Next.js App Router em `stem-erp/`)

**Performance Goals**: Alternância de toggle `SIM`/`NÃO` com feedback otimista imediato (< 50ms na UI) e zero queries extras na validação de sessão

**Constraints**: Zero cores hardcoded (apenas tokens semânticos do Design System), uso obrigatório de `<DashboardShell>` com `title` e `subtitle`, ações secundárias de linha de tabela agrupadas em botão único de engrenagem (`Settings` + `DropdownMenu`)

**Scale/Scope**: Multitenant por equipe (`Team`), cobrindo todos os usuários cadastrados e os 4 módulos de primeiro nível da aplicação

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio da Constituição / Regra `AGENTS.md` | Status Pré-Design | Status Pós-Design | Evidência / Garantia Arquitetural |
| :--- | :---: | :---: | :--- |
| **I. Clean Architecture & SOLID** | PASS | PASS | Componentes visuais (`ModulePermissionToggle`, `PermissionsTable`) separados do hook de estado/filtro (`usePermissionsTable`) e das Server Actions/Services (`auth-service.ts`). |
| **II. Design System Semântico & `tv()`** | PASS | PASS | Estilização dos toggles `SIM`/`NÃO` construída com `tailwind-variants` (`tv`) usando exclusivamente tokens semânticos (`bg-success`, `bg-muted`, `text-foreground`, `border-border`). |
| **III. Tipagem Estrita & Zod** | PASS | PASS | Tipos `SystemModuleKey` e `UserModulePermissionsDTO` estritos; payloads validados com `toggleUserModulePermissionSchema` e `updateAllUserPermissionsSchema`. |
| **IV. Testes Automatizados Obrigatórios** | PASS | PASS | Testes unitários cobrindo schemas Zod, regras de prevenção de auto-bloqueio, resolução de rotas permitidas e contratos de submódulos da sidebar. |
| **V. `DashboardShell` + Título/Subtítulo + Menu de Engrenagem** | PASS | PASS | Página `/permissoes` envolvida em `<DashboardShell title="..." subtitle="...">`; ações de linha na tabela encapsuladas em botão de engrenagem (`Settings` + `DropdownMenu`). |
| **VI. Multitenancy, Segurança & Auditoria** | PASS | PASS | Validação server-side em Server Actions e guardas de página, além de registro em `AuthAuditLog` a cada mudança de permissão. |

## Project Structure

### Documentation (this feature)

```text
specs/003-module-access-permissions/
├── plan.md              # Este arquivo (/speckit-plan)
├── research.md          # Decisões arquiteturais (Phase 0)
├── data-model.md        # Modelagem Prisma e DTOs (Phase 1)
├── quickstart.md        # Guia de validação (Phase 1)
├── contracts/
│   └── permissions-contracts.md  # Contratos de Server Actions, Zod e UI (Phase 1)
└── tasks.md             # Tarefas de implementação (/speckit-tasks)
```

### Source Code (repository root)

```text
stem-erp/
├── prisma/
│   └── schema.prisma                                      # Adição de canAccessFinance, canAccessRoi, canAccessCommunication, canAccessTeam em User
├── src/
│   ├── app/
│   │   ├── permissoes/
│   │   │   └── page.tsx                                   # Nova página dedicada de Permissões com DashboardShell (title + subtitle)
│   │   ├── equipe/
│   │   │   └── page.tsx                                   # Botão de atalho para /permissoes e guarda de módulo
│   │   ├── dashboard/page.tsx                             # Guarda de permissão do módulo Financeiro
│   │   ├── planejamento/page.tsx                          # Guarda de permissão do módulo Financeiro
│   │   ├── lancamentos/page.tsx                           # Guarda de permissão do módulo Financeiro
│   │   ├── roi/page.tsx                                   # Guarda de permissão do módulo ROI
│   │   ├── roi/acoes/page.tsx                             # Guarda de permissão do módulo ROI
│   │   └── comunicacao/page.tsx                           # Guarda de permissão do módulo Comunicação
│   ├── components/
│   │   ├── layout/
│   │   │   ├── app-sidebar.tsx                            # Filtro de módulos por permissão SIM/NÃO + Sub-itens de Equipe & Acessos
│   │   │   ├── mobile-nav-drawer.tsx                      # Filtro de módulos por permissão SIM/NÃO no mobile
│   │   │   └── __tests__/
│   │   │       └── app-sidebar.test.ts                    # Testes de visibilidade por permissão e submódulos
│   │   └── permissions/
│   │       ├── module-permission-toggle.tsx               # Toggle Button SIM / NÃO com tailwind-variants (tv)
│   │       ├── permissions-row-actions.tsx                # Botão de engrenagem (Settings + DropdownMenu) por usuário
│   │       ├── permissions-table.tsx                      # Tabela e cards mobile de permissões por usuário e módulo
│   │       ├── use-permissions-table.ts                   # Custom Hook para busca, filtro por equipe e atualização otimista
│   │       └── __tests__/
│   │           └── permissions.test.ts                    # Testes unitários de validação, proteção de auto-bloqueio e estilos
│   ├── lib/
│   │   ├── permissions.ts                                 # Utilitários puros de verificação de acesso por módulo e rota padrão
│   │   └── validations/
│   │       └── auth.ts                                    # Schemas Zod para alternância de permissões
│   ├── services/
│   │   └── auth-service.ts                                # Persistência das permissões e guarda requireModuleAccess
│   ├── actions/
│   │   └── auth-actions.ts                                # Server Actions toggleUserModulePermissionAction e updateAllUserPermissionsAction
│   └── types/
│       └── auth.ts                                        # SystemModuleKey e UserModulePermissionsDTO
```

**Structure Decision**: A arquitetura segue o padrão modular do `stem-erp/` (Next.js App Router), isolando utilitários puros em `src/lib/permissions.ts`, validações em `src/lib/validations/auth.ts`, regras de banco em `src/services/auth-service.ts`, Server Actions em `src/actions/auth-actions.ts` e componentes visuais de permissões em `src/components/permissions/`.

## Complexity Tracking

Nenhuma violação da Constituição. Todos os gates foram integralmente atendidos.
