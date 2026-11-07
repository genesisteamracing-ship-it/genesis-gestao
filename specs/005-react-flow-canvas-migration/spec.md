# Especificação Técnica: Migração Universal de Canvas para React Flow (@xyflow/react)

## 1. Visão Geral e Objetivo

Padronizar e migrar **todos os canvas interativos** do Genesis Gestão para o ecossistema profissional **React Flow** (`@xyflow/react`). 

Atualmente, o sistema possui duas interfaces baseadas em canvas/árvores de grafos:
1. **Mapa de Hierarquia dos Stakeholders** (`/comunicacao` — visualização em organograma de poder, interesse e parceiros).
2. **Estrutura Analítica do Projeto (WBS / EAP)** (`/documentos` — decomposição hierárquica do escopo de 100% em subsistemas e pacotes de trabalho).

Ambos os canvas devem migrar para o React Flow, compartilhando um **Design System unificado**, nós customizados com `tailwind-variants`, controles de zoom/pan nativos, minimap, grade de pontos semântica e arestas conectadas (`smoothstep`), eliminando duplicações de código e garantindo consistência visual e ergonômica absoluta entre os módulos.

---

## 2. Princípios de Design & Padrão Universal de Canvas

Todos os canvas do projeto devem obedecer rigorosamente à seguinte anatomia:

```
+-----------------------------------------------------------------------------------+
| Toolbar Superior: [Ícone + Título do Módulo] [Métricas/Contadores] | [Alternador Canvas/Tabela] [Zoom - / + / Fit] |
+-----------------------------------------------------------------------------------+
| Viewport React Flow (grade de pontos semântica radial/dots)                       |
|                                                                                   |
|            [ Raiz do Projeto / Organização Principal ]                            |
|                                | (smoothstep edge)                                |
|        +-----------------------+-----------------------+                          |
|        |                                               |                          |
|   [ Nó Nível 1 (Card) ]                       [ Nó Nível 1 (Card) ]               |
|        |                                               |                          |
|   [ Nó Nível 2 (Card) ]                       [ Nó Nível 2 (Card) ]               |
|                                                                                   |
|                                                        +---------------------+    |
|                                                        | MiniMap estilizado  |    |
|                                                        +---------------------+    |
+-----------------------------------------------------------------------------------+
```

### 2.1. Regras Visuais Inegociáveis
1. **Container / Shell**: Envolvido por `relative overflow-hidden rounded-2xl border border-border bg-card shadow-xs`.
2. **Background Semântico**: Uso de `<Background variant={BackgroundVariant.Dots} gap={24} size={1.2} />` com cor derivada de `var(--border)`.
3. **Controles & MiniMap**: `<Controls showInteractive={false} />` com botões estilizados no design system do projeto e `<MiniMap />` translúcido no canto inferior direito com `backdrop-blur-xs` e borda `border-border`.
4. **Nós Customizados (Custom Nodes)**:
   - Construídos exclusivamente com componentes React registrados em `nodeTypes`.
   - Estilizados com `tailwind-variants` (`tv`) e tokens semânticos (`bg-card`, `border-border`, `text-foreground`, `text-primary`, `text-purple`, etc.).
   - Zero cores hexadecimais diretas (`#fff`, `#000`, etc.).
   - Conectores `<Handle />` discretos e perfeitamente alinhados (`Top` e `Bottom`).
   - **Menu de Ações Contextual (Gear Dropdown)**: Cada nó possui um menu de ações encapsulado no botão padrão de engrenagem (`Settings` + `<DropdownMenu>`), permitindo editar, excluir ou inspecionar o nó conforme as diretrizes do projeto.
5. **Ações Interativas por Hover (Quick Add on Hover)**:
   - Ao passar o mouse (`hover`) sobre o card ou aproximar dos conectores:
     - **Botão `+` Inferior (Abaixo do Card)**: Exibe botão flutuante suave com ícone `Plus` para adicionar instantaneamente um nó filho (sub-entregável na WBS ou subordinado no mapa de stakeholders).
     - **Botão `+` Lateral (Ao Lado do Card)**: Permite adicionar um nó irmão no mesmo nível hierárquico.
6. **Arestas Conectoras (Edges)**:
   - Estilo `smoothstep` com cor e espessura suaves derivadas de `var(--border)`.
7. **Menu e Toolbar Superior do Canvas**:
   - Barra superior com métricas consolidadas, botão de menu de configurações de visualização, controles de zoom e alternador em pílula `Árvore (Canvas)` / `Tabela`.

---

## 3. Escopo Funcional & Módulos Afetados

### 3.1. Módulo 1: WBS / EAP (`/documentos`)
- **Nós da Árvore**:
  - Nó Raiz Mestre: `Projeto STEM Racing (100%)` exibindo custo total e horas totais consolidadas.
  - Nós de Entregáveis e Pacotes de Trabalho: Código EAP (ex: `1.2.1`), título, disciplina, status, responsável, horas e custos consolidados/estimados.
  - **Fluxo de Adição Cadastral via Modal**:
    - Na WBS, novos nós exigem preenchimento formal de campos estruturados (Código EAP, Título, Disciplina, Responsável Técnico, Estimativa de Custo em centavos e Horas).
    - A criação de sub-entregáveis é disparada pelo botão `+` no cabeçalho do card ou no menu de engrenagem (`WbsRowActions`), abrindo o modal com o código sugerido pré-preenchido (ex: filho de `1.2` sugere `1.2.1`).
    - Novos entregáveis de Nível 1 são criados pelo botão "Novo Entregável Raiz" no topo.
- **Layout Automático em Árvore**:
  - Algoritmo determinístico de posicionamento hierárquico (Dagre / layout em árvore por níveis de profundidade `depth` e ordem `sortOrder`).

### 3.2. Módulo 2: Mapa de Stakeholders (`/comunicacao`)
- **Nós do Organograma**:
  - Nó Raiz da Equipe: `Equipe STEM Racing` com contadores de parceiros e stakeholders.
  - Nós de Parceiros / Organizações: SESI, SENAI, Patrocinadores com cotas.
  - Nós de Indivíduos Stakeholders: Nome, papel, matriz Poder/Interesse, frequência e canal de comunicação.
  - **Ações Interativas por Hover (Quick Add)**:
    - **Botão `+` Inferior (Abaixo do Card)**: Dispara criação rápida de subordinado hierárquico na vertical (com `parentStakeholderId` pré-configurado).
    - **Botão `+` Lateral (Ao Lado do Card)**: Dispara criação rápida de stakeholder de mesmo nível na organização.
  - **Ações Estruturais**: Inspecionar ficha detalhada, abrir histórico de comunicação ou editar via diálogo.
- **Layout Hierárquico por Poder e Interesse**:
  - Mapeamento determinístico de níveis verticais (SESI -> Diretoria -> Técnicos -> Professores/Alunos).

---

## 4. Requisitos de Testes & Quality Gates

1. **Testes Unitários**:
   - Layout determinístico de conversão da árvore em `nodes` e `edges` do React Flow (`wbsToFlowElements`, `stakeholdersToFlowElements`).
   - Variantes de estilo dos nós (`tailwind-variants`) com 100% de conformidade aos tokens semânticos.
2. **Quality Gates**:
   - Aprovação integral em `npm run lint -- --quiet`.
   - 100% de sucesso na bateria `npm test`.
   - 0 erros em `npx tsc --noEmit`.
3. **Commit & Push**:
   - Execução obrigatória de `git commit` e `git push origin <branch>` ao concluir a spec.

---

## 5. Critérios de Aceite

- [ ] Pacote `@xyflow/react` instalado e configurado no `stem-erp`.
- [ ] Componente base de Canvas unificado (`CanvasShell` / `FlowCanvas`) reutilizável entre WBS e Stakeholders.
- [ ] WBS / EAP em `/documentos` renderizada com React Flow, suporte a pan, zoom, minimap e nós customizados estilizados.
- [ ] Mapa de Stakeholders em `/comunicacao` migrado para React Flow mantendo todas as ações e filtros existentes.
- [ ] Ambos os módulos mantêm paridade de dados, ações modais e alternância fluida com o modo Tabela.
- [ ] Validações de lint, testes e tipagem estrita com TypeScript aprovados.
