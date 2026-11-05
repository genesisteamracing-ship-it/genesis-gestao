# Research & Architectural Decisions: Gerenciamento de Permissões de Acesso por Usuário e Módulo

**Feature**: `003-module-access-permissions`
**Date**: 2026-11-05

## 1. Armazenamento de Permissões por Módulo no Banco de Dados

- **Decision**: Adicionar 4 colunas booleanas explícitas diretamente na tabela `User` do Prisma (`canAccessFinance`, `canAccessRoi`, `canAccessCommunication`, `canAccessTeam`), com valores padrão seguros (`true` para módulos operacionais e `false` para `canAccessTeam`, exceto `SUPER_ADMIN` que possui acesso total).
- **Rationale**:
  1. **Zero Latência Adicional na Sessão**: A função `getCurrentUserFromSession()` em `src/services/auth-service.ts` já carrega o registro `User` em cada requisição autenticada. Ter os 4 booleanos na própria linha do `User` evita `JOIN`s adicionais em todas as renderizações de página.
  2. **Tipagem Estrita e Simples**: Evita serialização/desserialização de campos JSON genéricos e garante validação em nível de banco de dados (PostgreSQL `BOOLEAN NOT NULL`).
  3. **Compatibilidade Retroativa**: Valores `@default(true)` nos módulos operacionais garantem que usuários já cadastrados não percam acesso após a migração até que o administrador ajuste os toggles.
- **Alternatives considered**:
  - *Tabela relacional separada `UserModulePermission (userId, moduleKey, allowed)`*: Rejeitada por exigir `JOIN` extra em cada verificação de sessão para um conjunto fixo e bem definido de 4 módulos de primeiro nível.
  - *Coluna `Json` no Prisma*: Rejeitada por enfraquecer a tipagem estrita exigida pelo Princípio III da Constituição.

## 2. Componente Visual de Toggle Button `SIM` / `NÃO`

- **Decision**: Construir um componente dedicado `<ModulePermissionToggle />` utilizando `tailwind-variants` (`tv`) com slots (`root`, `pillYes`, `pillNo`, `label`) e semântica acessível (`role="switch"`, `aria-checked`, `aria-label="Acesso ao módulo [Módulo] para [Usuário]: SIM/NÃO"`).
- **Rationale**:
  - O usuário solicitou explicitamente um botão alternador com indicação clara no formato `Financeiro: SIM (NÃO)`.
  - Um controle segmentado/toggle de estado duplo que exibe simultaneamente `SIM` e `NÃO` (destacando `SIM` com token semântico `bg-success text-primary-foreground` quando ativo e `NÃO` com `bg-destructive/15 text-destructive` ou `bg-muted text-muted-foreground` quando inativo) oferece leitura imediata em tabelas e cartões mobile, além de permitir alternância com 1 único clique.
- **Alternatives considered**:
  - *Checkbox simples*: Rejeitado por não exibir explicitamente os rótulos `SIM` / `NÃO` solicitados pelo usuário.
  - *Select Dropdown com opções Sim/Não*: Rejeitado por exigir 2 cliques por alteração em vez de 1 clique direto de toggle.

## 3. Navegação e Estrutura de Rotas para a Tela de Permissões

- **Decision**:
  1. Criar a rota dedicada `/permissoes` (`src/app/permissoes/page.tsx`) envolvida obrigatoriamente pelo `<DashboardShell>` com `title="Permissões de Acesso"` e `subtitle="Configure individualmente o acesso de cada usuário aos módulos do sistema com botões SIM e NÃO"`.
  2. Transformar o item **Equipe & Acessos** na barra lateral (`AppSidebar` e `MobileNavDrawer`) em um grupo expansível (seguindo o mesmo padrão de *Finanças*, *ROI* e *Comunicação*) contendo dois sub-itens:
     - **Equipes & Integrantes** (`/equipe`)
     - **Permissões de Módulos** (`/permissoes`)
  3. Adicionar também um botão de atalho rápido no cabeçalho de `/equipe` levando para `/permissoes`.
- **Rationale**:
  - Mantém total consistência com os demais módulos da `AppSidebar` e permite acesso direto em 1 clique a partir de qualquer tela.

## 4. Aplicação Real das Permissões (Sidebar + Guardas de Rota)

- **Decision**:
  1. **Menu Lateral (`AppSidebar` e `MobileNavDrawer`)**: Filtrar a exibição dos grupos de módulos (`Finanças`, `ROI`, `Comunicação`, `Equipe & Acessos`) com base no objeto `currentUser.permissions`.
  2. **Proteção Server-Side por Módulo**: Criar o helper `requireModuleAccess(moduleKey)` (ou validar dentro das páginas/actions de cada módulo) para redirecionar o usuário para a primeira rota permitida (ou exibir estado de acesso restrito) caso tente acessar diretamente por URL um módulo marcado como `NÃO`.
- **Rationale**:
  - Ocultar apenas no menu lateral seria insuficiente do ponto de vista de segurança (Princípio VI da Constituição). A validação no servidor garante bloqueio real contra acesso direto por URL.
