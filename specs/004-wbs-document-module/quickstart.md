# Quickstart & Validation Guide: Módulo Documentos e WBS (EAP)

**Feature**: `004-wbs-document-module`  
**Date**: 2026-11-06  
**Status**: Ready for Implementation

Este guia descreve os cenários de validação de ponta a ponta para verificar o correto funcionamento da WBS (EAP) no novo módulo de Documentos.

---

## 1. Pré-Requisitos e Preparação

1. **Repositório e Dependências**:
   ```powershell
   cd stem-erp
   npm run build # ou npm run dev
   ```
2. **Banco de Dados e Migração**:
   - Assegurar que a migração do Prisma contendo o modelo `WbsNode` foi aplicada:
   ```powershell
   npx prisma db push # ou npx prisma migrate dev
   ```
3. **Usuário Autenticado**:
   - Estar autenticado como integrante com acesso a uma equipe ativa (`teamId`).

---

## 2. Cenários de Validação Ponta a Ponta

### Cenário 1: Navegação e Visualização do Shell Padronizado
- **Ação**: Acessar o sistema e localizar o item **Documentos** no menu lateral (`AppSidebar`).
- **Comportamento Esperado**:
  - A URL navega para `/documentos`.
  - A tela é renderizada com o cabeçalho `<DashboardShell>` contendo:
    - Título: `Documentos`
    - Subtítulo: `Estrutura Analítica do Projeto (WBS / EAP) e Decomposição de Escopo`
  - A barra lateral fixa permanece renderizada em desktop e a gaveta mobile é acessível em resoluções menores.

---

### Cenário 2: Criação de Entregáveis e Sub-entregáveis (Regra dos 100%)
- **Ação**:
  1. Clicar em "Novo Entregável Raiz" e cadastrar:
     - Código: `1.0`
     - Título: `Carro de Corrida STEM Racing`
     - Disciplina: `Engenharia & CAD`
  2. No nó `1.0`, abrir o menu de engrenagem (`Settings`) e selecionar "Adicionar Sub-entregável":
     - Código: `1.1`
     - Título: `Chassis e Transmissão`
     - Disciplina: `Manufatura & CNC`
  3. No nó `1.1`, adicionar o pacote de trabalho folha:
     - Código: `1.1.1`
     - Título: `Fixação do Eixo Traseiro`
     - Custo Estimado: `R$ 250,00` (25000 centavos)
     - Horas Estimadas: `12`
     - Responsável Técnico: Selecionar um integrante da equipe
- **Comportamento Esperado**:
  - A árvore exibe `1.0` -> `1.1` -> `1.1.1` com indentação visual e badges semânticos.
  - O nó `1.1` e o nó `1.0` agregam automaticamente (*roll-up*) o custo de R$ 250,00 e 12 horas, comprovando a Regra dos 100%.

---

### Cenário 3: Exclusão com Confirmação e Cascata
- **Ação**:
  - No nó `1.1`, abrir o menu de engrenagem e clicar em "Excluir".
- **Comportamento Esperado**:
  - O sistema exibe um diálogo de confirmação avisando que o sub-entregável `1.1.1` também será excluído.
  - Após confirmação, ambos os nós são removidos e o totalizador do projeto recalcula para R$ 0,00.

---

### Cenário 4: Modo Juízes / Apresentação de Project Management
- **Ação**:
  - Clicar no botão "Modo Apresentação" na barra superior da WBS.
- **Comportamento Esperado**:
  - Os botões de adição, edição e exclusão são ocultados.
  - A árvore entra em visualização limpa de leitura, exibindo códigos EAP, nomes, disciplinas, responsáveis e custos.
  - Os botões de filtro de profundidade ("Nível 1", "Nível 2", "Expandir Todos") reorganizam a árvore instantaneamente (< 500ms).

---

## 3. Comandos de Verificação Automatizada

- **Testes Unitários de Roll-up e Validação de Esquemas Zod**:
  ```powershell
  npm test
  ```
- **Verificação de Tipagem Estática**:
  ```powershell
  npm run typecheck # tsc --noEmit
  ```
