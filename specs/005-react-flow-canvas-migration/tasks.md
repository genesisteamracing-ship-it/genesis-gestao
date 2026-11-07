# Tasks: Migração Universal de Canvas para React Flow (@xyflow/react)

**Input**: Design documents from `specs/005-react-flow-canvas-migration/` (`spec.md`, `plan.md`)  
**Prerequisites**: spec.md (required), plan.md (required)  
**Tests**: Testes unitários para layout adapters e estilização de nós.  
**Organization**: Organização sequencial: instalação/fundação, nós customizados compartilhados, migração da WBS, migração de Stakeholders, validação e sincronização remota.

---

## Phase 1: Setup & Dependências

- [X] T001 Instalar a dependência `@xyflow/react` no projeto `stem-erp` via `npm install @xyflow/react`
- [X] T002 [P] Importar e verificar os estilos CSS padrão do React Flow (`@xyflow/react/dist/style.css`) integrados ao tema Tailwind semântico em `stem-erp/src/app/globals.css` ou componente de layout
- [X] T003 [P] Criar componente base reutilizável `FlowCanvasShell` com `<ReactFlow>`, `<Background>`, `<Controls>`, `<MiniMap>` e toolbar com menu de opções em `stem-erp/src/components/canvas/flow-canvas-shell.tsx`

---

## Phase 2: Adaptadores e Nós Customizados da WBS

- [X] T004 [P] Implementar o adaptador de layout hierárquico `wbsToFlowElements` calculando posições `x` e `y` por níveis e criando `nodes` e `edges` com `type: "smoothstep"` em `stem-erp/src/components/wbs/wbs-flow.adapter.ts`
- [X] T005 [P] Criar o nó customizado `WbsFlowNode` utilizando `tailwind-variants` (`tv`), Handles Top/Bottom, chips semânticos por disciplina, botão de engrenagem (`Settings` + `<DropdownMenu>`) para menu de ações contextuais em `stem-erp/src/components/wbs/wbs-flow-node.tsx`
- [X] T006 Implementar `WbsFlowCanvas` com React Flow, suporte a pan, zoom, fitView, toolbar com menu de visualizações e alternância entre Canvas e Tabela em `stem-erp/src/components/wbs/wbs-flow-canvas.tsx`
- [X] T007 Atualizar `WbsView` em `stem-erp/src/components/wbs/wbs-view.tsx` para renderizar `WbsFlowCanvas` como visualização em árvore oficial

---

## Phase 3: Adaptadores e Nós Customizados de Stakeholders

- [X] T008 [P] Implementar o adaptador de layout `stakeholdersToFlowElements` mapeando a hierarquia vertical e lateral com posições automáticas em `stem-erp/src/components/communication/org-map/stakeholder-flow.adapter.ts`
- [X] T009 [P] Criar o nó customizado `StakeholderFlowNode` com Handles Top/Bottom/Left/Right, menu de engrenagem contextual e botões interativos de hover `+` (subordinado abaixo e mesmo nível ao lado) em `stem-erp/src/components/communication/org-map/stakeholder-flow-node.tsx`
- [X] T010 Migrar `StakeholderOrgMap` para utilizar o React Flow (`@xyflow/react`) com menu de controles integrado em `stem-erp/src/components/communication/org-map/stakeholder-org-map.tsx`

---

## Phase 4: Testes & Quality Gates

- [X] T011 [P] Criar testes unitários para os adaptadores `wbsToFlowElements` e `stakeholdersToFlowElements` em `stem-erp/src/components/wbs/__tests__/wbs-flow-adapter.test.ts`
- [X] T012 Executar validações de qualidade: `npm run lint -- --quiet`, `npm test` e `npx tsc --noEmit`
- [X] T013 Realizar commit e push obrigatórios para a branch remota (`git push origin <branch>`) conforme a regra de governança
