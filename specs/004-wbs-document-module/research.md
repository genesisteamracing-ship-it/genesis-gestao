# Research & Technology Decisions: Módulo Documentos e WBS / EAP

**Feature**: `004-wbs-document-module`  
**Date**: 2026-11-06  
**Status**: Completed

## 1. Estrutura de Dados Hierárquica para WBS no Prisma / PostgreSQL

### Contexto
A WBS (EAP) é uma árvore de entregáveis que pode possuir de 2 a 5 níveis de profundidade (ex.: Nível 1 = Projeto Geral, Nível 2 = Subsistema, Nível 3 = Pacote de Trabalho, Nível 4 = Subcomponente). A estrutura precisa suportar operações eficientes de consulta, adição de filhos, renumeração de códigos EAP (1.1, 1.2, 1.2.1) e integridade referencial.

### Decisão
Utilizar o padrão **Adjacency List** com auto-relacionamento (`parentId` referenciando `WbsNode.id`) complementado por um campo indexado de código estruturado (`code`: `String`, ex.: `"1.2.3"`), ordem de exibição (`sortOrder`: `Int`) e chave de profundidade (`depth`: `Int`).

### Racional
1. O volume de nós por temporada de uma escuderia STEM varia tipicamente entre 30 e 200 entregáveis.
2. Uma única consulta indexada por `teamId` (e opcionalmente `season`) traz a árvore completa em menos de 10ms.
3. A montagem da árvore em memória no TypeScript é trivial, recursiva e altamente testável via testes unitários puros (`node:test`).
4. A reordenação ou exclusão em cascata é gerenciada de forma segura com `onDelete: Cascade` no banco e validação na camada de serviço.

### Alternativas Consideradas
- **Closure Table (Tabela de Fechamento de Relacionamentos)**: Rejeitado por adicionar complexidade desnecessária de junção e escrita para um volume pequeno de dados.
- **Materialized Path puro (apenas string de caminho)**: Rejeitado pois a navegação direta de chaves estrangeiras com integridade referencial do Prisma se torna mais frágil.

---

## 2. Estratégia de Agregação e Regra dos 100% (Roll-up de Custos e Horas)

### Contexto
Pela Regra dos 100%, a WBS deve garantir que o valor (custo de fabricação e esforço em horas) de um nó pai seja rigorosamente a soma de todos os seus nós filhos. Se um nó é folha (*leaf*), ele possui valor direto; se possui filhos, seu valor deve ser derivado e protegido contra discrepâncias manuais.

### Decisão
Implementar a agregação (*roll-up*) na camada de domínio (`wbs-rollup.service.ts`) usando inteiros representando centavos (`amountCents: Int`) e horas (`estimatedHours: Float` ou `Int`).
- Nós folha armazenam valores digitados pelo usuário.
- Nós intermediários e raiz têm seus valores calculados de baixo para cima (*bottom-up*) de forma puramente determinística.
- A camada de apresentação exibe valores calculados com indicação clara de agregação automática.

### Racional
1. Atende à Constituição do Projeto (Princípio III: integridade matemática em centavos, sem imprecisões de ponto flutuante IEEE 754).
2. Evita inconsistências de concorrência onde um usuário edita um filho e o pai fica desatualizado no banco.
3. Permite testabilidade unitária de 100% com mocks simples de árvores.

### Alternativas Consideradas
- **Triggers em PL/pgSQL no PostgreSQL**: Rejeitado por dificultar testes unitários rápidos (`npm test` com `tsx --test`), esconder lógica de negócio fora do TypeScript e dificultar portabilidade.
- **Cálculo exclusivo no Client-side**: Rejeitado pois exportações para juízes e relatórios de auditoria no servidor precisam do valor consolidado confiável.

---

## 3. Padrão Visual da Interface (Árvore Hierárquica + Tabela Indentada Mobile-First)

### Contexto
A visualização da WBS precisa ser clara para os juízes de Project Management, permitindo ver a hierarquia, código, responsável, disciplina e custos, além de ser utilizável em telas móveis e desktop conforme o Princípio V da Constituição.

### Decisão
Criar uma visão composta com dois modos:
1. **Modo Estrutura Analítica (Padrão)**: Tabela hierárquica indentada com linhas expansíveis/colapsáveis (`ChevronRight` / `ChevronDown`), badges de disciplina com cores semânticas (`bg-primary/10`, `text-primary`, `bg-purple/10`, etc.), indicador de nível, menu de ações por engrenagem (`Settings` + `DropdownMenu`), e controles superiores para expandir todos, recolher ou focar em Nível 1 / Nível 2.
2. **Modo Juízes / Apresentação**: Modo de leitura limpo que oculta botões de mutação, ativa filtros de profundidade rápida e otimiza layout para projeção em telão ou impressão (CSS print).

### Racional
1. Segue integralmente a anatomia de layout shell (`<DashboardShell>`), com título e subtítulo contextual.
2. Cumpre a regra do menu de engrenagem para ações de linha (Adicionar Sub-entregável, Editar, Excluir).
3. Adapta-se a telas mobile com recuos elásticos, cartões aninhados e `overflow-x-auto`.

---

## 4. Integração no Menu Lateral e Permissões de Módulo

### Contexto
O usuário solicitou explicitamente adicionar a WBS em um novo módulo chamado **Documentos**. O sistema possui controle de permissões por módulo no modelo `User` (`canAccessFinance`, `canAccessRoi`, etc.) e na barra lateral (`AppSidebar`).

### Decisão
1. Adicionar o item **Documentos** na barra lateral fixa (`AppSidebar`) e gaveta mobile (`MobileNavDrawer`) com ícone contextual (ex.: `FolderGit2` ou `FileText` do `lucide-react`) apontando para `/documentos`.
2. Criar a rota Next.js App Router em `stem-erp/src/app/documentos/page.tsx` envolvida pelo `<DashboardShell>`.
3. Expandir a tipagem de permissões do usuário (`AuthenticatedUserDTO`) para incluir `canAccessDocuments: boolean` (com padrão `true`), garantindo que o módulo de permissões continue operando harmoniosamente.
