# Phase 0 Research: Mapa Organizacional e Hierárquico de Stakeholders na Comunicação

**Feature**: `001-stakeholder-hierarchy-map`  
**Date**: 2026-11-03

## 1. Algoritmo de Hierarquia por Parceiro e Nível de Poder/Interesse

- **Decision**: Implementar um motor híbrido determinístico de construção de árvore (`buildStakeholderHierarchyTree` em `src/lib/communication-hierarchy.ts`) que combina:
  1. **Agrupamento de 1º Nível por Parceiro/Organização**: Cada `Sponsor` vinculado ou nome de `organization` normalizado (ex: `"SESI"`, `"SENAI"`, `"Bosch"`) torna-se um nó de Parceiro conectado abaixo do nó raiz da Equipe (`Team`).
  2. **Encadeamento Vertical Automático por Precedência de Poder e Interesse**: Quando os stakeholders de um mesmo parceiro possuem níveis distintos de Poder e Interesse (e não possuem `parentStakeholderId` explícito), o algoritmo ordena-os em 4 degraus hierárquicos decrescentes:
     - **Degrau 1 (Peso 4 - Estratégico/Diretoria)**: `power = HIGH` e `interest = HIGH` (Gerenciar de Perto — ex: *Diretoria*).
     - **Degrau 2 (Peso 3 - Institucional)**: `power = HIGH` e `interest = LOW` (Manter Satisfeito — ex: *Conselho / Coordenação Geral*).
     - **Degrau 3 (Peso 2 - Tático/Técnico)**: `power = LOW` e `interest = HIGH` (Manter Informado — ex: *Técnicos / Mentores*).
     - **Degrau 4 (Peso 1 - Operacional/Base)**: `power = LOW` e `interest = LOW` (Monitorar — ex: *Professores / Apoiadores*).
     Os degraus presentes em um parceiro são encadeados verticalmente (`Parceiro [SESI]` → `Degrau 1 [Diretoria]` → `Degrau 3 [Técnicos]` → `Degrau 4 [Professores]`), reproduzindo exatamente o comportamento solicitado pelo usuário sem exigir configuração manual complexa.
  3. **Vínculo Explícito Opcional (`parentStakeholderId`)**: Caso o usuário selecione explicitamente um stakeholder superior no formulário (ou clique em "Adicionar Subordinado" diretamente em um nó do gráfico), o vínculo explícito tem precedência direta, evitando ciclos via validação em árvore (DFS).
- **Rationale**: Atende perfeitamente ao exemplo do usuário (`SESI | Diretoria | Técnicos | Professores`) tanto de forma automática (pelos níveis de Poder e Interesse já existentes no modelo de Mendelow) quanto de forma manual (quando houver múltiplos níveis customizados dentro da mesma organização).
- **Alternatives considered**:
  - *Apenas `parentStakeholderId` manual*: Rejeitado porque obrigaria o usuário a sempre configurar manualmente cada pai, ignorando a regra de negócio explícita de que "eles devem ser organizados de maneira hierárquica de acordo com seu nível de interesse e poder sobre o projeto".
  - *Apenas grade 2x2 de Mendelow*: Rejeitado porque o usuário pediu expressamente para substituir a visualização atual pelo gráfico hierárquico em árvore.

## 2. Renderização do Gráfico Hierárquico Interativo (Organization Map)

- **Decision**: Construir um componente nativo de árvore organizacional interativa baseado em HTML/CSS Flexbox recursivo + conectores ortogonais precisos e suporte a Pan/Zoom/Minimapa em React (`StakeholderOrgMap`), estilizado exclusivamente com `tailwind-variants` (`tv`) e tokens semânticos do Design System (`bg-card`, `border-primary`, `border-purple`, `border-success`, `border-warning`, `bg-background`).
- **Rationale**:
  - Zero dependências externas pesadas de canvas (como ReactFlow ou D3), mantendo o bundle enxuto, compatibilidade total com Server-Side Rendering / Next.js 16 Turbopack e execução de testes unitários/integração em menos de 3 segundos (`tsx --test`).
  - O layout recursivo em árvore (`flex-col items-center` para níveis verticais e `flex-row items-start` com barras conectoras horizontais/verticais para ramificações) reproduz com precisão cirúrgica o visual do "Organization Map" da imagem de referência (nós com bordas semânticas iluminadas, indicadores de status, linhas ortogonais e cartões de planos "Em Andamento" na base).
  - Garante total acessibilidade por teclado (`tabIndex`, `role="tree"`, `role="treeitem"`, `aria-expanded`) e adaptação Mobile-First (scroll/pan suave + alternância para visão compacta em telas pequenas).
- **Alternatives considered**:
  - *Instalar `@xyflow/react` (React Flow) ou `d3-hierarchy`*: Rejeitado por adicionar peso desnecessário ao bundle, exigir cálculos manuais de coordenadas absolutas (`x, y`) com `dagre` e dificultar a estilização estrita com `tailwind-variants` e tokens semânticos sem valores hexadecimais hardcoded.

## 3. Integração dos Cartões de Base ("In Progress" / Planos de Comunicação) e Fluxos Existentes

- **Decision**:
  - Na base de cada folha de stakeholder na árvore, renderizar cartões de planos/ações de comunicação ativos (`OrgMapPlanCard`), exibindo o título do `CommunicationPlan` ativo (ou último disparo), canal preferencial e uma barra visual de progresso/frequência, espelhando os cartões inferiores da imagem de referência.
  - Manter as ferramentas operacionais existentes (Gerador de Relatórios WhatsApp/E-mail, Diretório em Tabela e Histórico de Disparos/Feedbacks) acessíveis tanto por interação direta nos nós do gráfico (via modal/gaveta de inspeção `StakeholderInspectorDialog`) quanto pelo seletor superior de visão da página.
- **Rationale**: Cumpre o requisito de substituir a visualização padrão pelo gráfico interativo onde cada novo stakeholder cadastrado aparece imediatamente, sem perder nenhuma funcionalidade de prestação de contas e auditoria exigida pela Constituição do projeto.
- **Alternatives considered**:
  - *Remover completamente o gerador de relatórios e logs*: Rejeitado pois violaria o Princípio IV e VI da Constituição (geração de relatórios de comunicação e trilha auditável).
