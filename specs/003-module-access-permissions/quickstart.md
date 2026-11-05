# Quickstart & Validation Guide: Gerenciamento de Permissões de Acesso por Usuário e Módulo

**Feature**: `003-module-access-permissions`
**Date**: 2026-11-05

## Pré-requisitos

1. Dependências instaladas em `stem-erp/`.
2. Schema do Prisma sincronizado com os novos campos booleanos de permissão em `User` (`npx prisma generate` / `npx prisma db push`).

## Comandos de Verificação e Testes

```powershell
# 1. Executar bateria completa de testes unitários e de contratos
npm --prefix stem-erp test

# 2. Verificar tipagem estática do TypeScript (Zero any / Zero erros)
npx tsc --project stem-erp/tsconfig.json --noEmit
```

## Cenários de Validação Ponta a Ponta

1. **Acesso à Tela de Permissões (`/permissoes`)**:
   - No menu lateral, expandir **Equipe & Acessos** e clicar em **Permissões**.
   - Verificar que o `<DashboardShell>` exibe o título `"Permissões de Acesso"` e a descrição contextual no topo da página.
2. **Alternância de Permissão via Toggle `SIM` / `NÃO`**:
   - Na linha de um integrante, clicar no botão toggle do módulo **Financeiro** para mudar de `SIM` para `NÃO`.
   - Verificar a notificação de confirmação e recarregar a página para confirmar a persistência no banco de dados.
3. **Proteção contra Auto-Bloqueio Administrativo**:
   - Na linha do próprio usuário administrador logado, verificar que o toggle do módulo **Equipe & Acessos** está protegido contra alteração para `NÃO`.
4. **Reflexo na Barra Lateral e Guarda de Rota**:
   - Para um usuário com `Financeiro: NÃO`, verificar que o grupo **Finanças** não é exibido na `AppSidebar`/`MobileNavDrawer` e que o acesso direto a `/dashboard`, `/planejamento` ou `/lancamentos` redireciona automaticamente para o primeiro módulo permitido.
