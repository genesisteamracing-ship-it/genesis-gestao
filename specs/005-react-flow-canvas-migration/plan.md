# Implementation Plan: Migração Universal de Canvas para React Flow (@xyflow/react)

**Branch**: `005-react-flow-canvas-migration` | **Date**: 2026-11-06 | **Spec**: [spec.md](file:///c:/Users/N01/OneDrive/Documentos\agenesis-gesta/specs/005-react-flow-canvas-migration/spec.md)

**Input**: Feature specification from `specs/005-react-flow-canvas-migration/spec.md`

## Summary

Migrar todas as visualizações em Canvas do sistema Genesis Gestão para o **React Flow** (`@xyflow/react`), abrangendo a **WBS / EAP** (`/documentos`) e o **Mapa de Hierarquia de Stakeholders** (`/comunicacao`). A arquitetura estabelece um componente base unificado (`FlowCanvasContainer`), nós customizados padronizados com `tailwind-variants` (`tv`), grade semântica com `<Background />`, controles nativos com `<Controls />`, `<MiniMap />` e arestas suaves (`smoothstep`), com zero cores hexadecimais arbitrarias.

---

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+  
**Primary Dependencies**: Next.js 15+ (App Router, Server Actions), React 19, `@xyflow/react`, `tailwind-variants` (`tv`), Radix UI / `shadcn/ui`, `lucide-react`, Zod  
**Testing**: `node:test` com `tsx` (`npm test`), testes de renderização e layouts determinísticos de grafos  
**Target Platform**: Web responsivo (Mobile-first, tablets e desktops)  
**Performance Goals**: Tempo de renderização/layout do grafo < 300ms; pan/zoom a 60fps sem engasgos  
**Constraints**: Zero hardcoding de cores (tokens semânticos), conformidade com `@xyflow/react` v12+, persistência do estado e paridade com formulários/ações existentes.

---

## Constitution Check

| Princípio Constitucional | Status | Justificativa / Mecanismo de Conformidade |
| :--- | :---: | :--- |
| **I. Clean Architecture & SOLID** | PASS | Separação estrita: adaptadores de nós/arestas (`wbs-flow.adapter.ts`, `stakeholder-flow.adapter.ts`), componentes de visualização desacoplados. |
| **II. Design System & Zero Hardcoding** | PASS | Uso exclusivo de tokens semânticos (`bg-background`, `text-foreground`, `border-border`, etc.). Variantes construídas com `tailwind-variants` (`tv`). |
| **III. Tipagem Estrita** | PASS | Tipagem estrita de nós (`Node<WbsNodeData>`, `Node<StakeholderNodeData>`), arestas (`Edge`) e zero uso de `any`. |
| **IV. Testes Automatizados** | PASS | Testes unitários para adaptadores de grafos e variantes dos nós. |
| **V. Layout Shell & Mobile-First** | PASS | Mantido sob `<DashboardShell>` em ambas as rotas (`/documentos` e `/comunicacao`), com alternador `Canvas` / `Tabela`. |
| **VI. Multitenancy & Segurança** | PASS | Preservação total do isolamento por `teamId` e regras de autorização de leitura para `AUDITOR`. |

---

## Project Structure & Architecture

```text
stem-erp/src/
├── components/
│   ├── canvas/
│   │   ├── flow-canvas-shell.tsx         # Shell unificado React Flow (Background, Controls, MiniMap)
│   │   ├── flow-toolbar.tsx              # Toolbar com menu de opções, métricas e alternador Canvas / Tabela
│   │   └── flow-styles.ts                # Estilização compartilhada de nós, menus e edges com tv()
│   ├── wbs/
│   │   ├── wbs-flow-canvas.tsx           # Canvas da WBS usando React Flow
│   │   ├── wbs-flow-node.tsx             # Nó customizado React Flow com menu de engrenagem para entregáveis da WBS
│   │   └── wbs-flow.adapter.ts           # Converte árvore WbsTreeNode[] em Node[] e Edge[] com layout hierárquico
│   └── communication/
│       └── org-map/
│           ├── stakeholder-flow-canvas.tsx   # Canvas de Stakeholders usando React Flow
│           ├── stakeholder-flow-node.tsx     # Nó customizado React Flow com menu contextual e hover buttons
│           └── stakeholder-flow.adapter.ts   # Converte hierarquia de stakeholders em Node[] e Edge[]
```
