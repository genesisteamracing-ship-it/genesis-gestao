---
name: "frontend"
description: "Diretrizes e padrões de desenvolvimento frontend (Design System, Tokens, Shadcn UI First, Tailwind Variants, Layout Shell e Paginação Padrão)."
metadata:
  author: "antigravity"
  version: "1.0.0"
---

# Skill: Frontend & Design System Standards

Esta skill define as regras inegociáveis de desenvolvimento frontend para este projeto. Qualquer tela, tabela ou componente implementado ou refatorado deve seguir rigorosamente estas diretrizes.

## 1. Padrão Universal de Paginação de Tabelas
Toda tabela paginada deve obrigatoriamente seguir o padrão de `/equipe` e `/lancamentos`:
- **Tamanho Fixo em 10:** O `pageSize` em hooks TanStack Table (`useReactTable`) e estados locais deve ser **obrigatoriamente 10**.
- **PROIBIDO seletores dinâmicos:** Nunca criar `<Select>` com opções como `"5 / pág"`, `"10 / pág"` ou `"Exibir:"`.
- **Anatomia do Rodapé:**
  - **Esquerda:** `Mostrando {startRow}-{formattedEndRow} de {totalFiltered} [entidades]`.
  - **Direita:** Indicador de texto `Página {page} de {totalPages}` e grupo de 4 botões de navegação (`ChevronsLeft`, `ChevronLeft`, `ChevronRight`, `ChevronsRight`) encapsulados em um container com borda suave (`border border-border bg-card shadow-2xs`).

### Exemplo de Estrutura:
```tsx
<div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pt-1">
  <p className="text-xs sm:text-sm font-medium text-muted-foreground text-center sm:text-left">
    Mostrando {startRow}-{formattedEndRow} de {totalFiltered} registros
  </p>

  <div className="flex items-center gap-2">
    <span className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
      Página {table.getState().pagination.pageIndex + 1} de{" "}
      {Math.max(1, table.getPageCount())}
    </span>
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-border bg-card shadow-2xs">
      <button
        type="button"
        onClick={() => table.setPageIndex(0)}
        disabled={!table.getCanPreviousPage()}
        aria-label="Primeira página"
        title="Primeira página"
        className="flex h-8 w-8 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
        aria-label="Página anterior"
        title="Página anterior"
        className="flex h-8 w-8 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
        aria-label="Próxima página"
        title="Próxima página"
        className="flex h-8 w-8 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
        disabled={!table.getCanNextPage()}
        aria-label="Última página"
        title="Última página"
        className="flex h-8 w-8 items-center justify-center text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </div>
  </div>
</div>
```

## 2. Ações de Linha em Tabelas (Menu de Engrenagem Obrigatório)
- Toda tabela que tiver ações por linha (Editar, Excluir, etc.) deve agrupá-las dentro de um único botão de engrenagem (`Settings`) que abre um `<DropdownMenu>` alinhado ao final (`align="end"`).
- Nunca renderizar botões soltos em células de tabela.

## 3. Layout Shell Obrigatório
- Todas as rotas autenticadas devem ser envolvidas por `<DashboardShell>`.
- Todo `<DashboardShell>` deve obrigatoriamente definir tanto um `title` quanto um `subtitle` contextual e explicativo.

## 4. Finalização de Specs e Sincronização Remota (Commit & Push)
- Ao finalizar qualquer especificação ou conjunto de tarefas (`tasks.md`), o agente deve obrigatoriamente validar os testes e qualidade de código e executar `git commit` e `git push origin <branch>` antes de reportar a conclusão ao usuário.

## 5. Padrão Universal de Canvas e Grafos (React Flow First)
Sempre que o sistema exigir visualizações em canvas, diagramas de árvore hierárquica, grafos de relacionamento ou organogramas (como o Mapa de Stakeholders e a WBS / EAP de Documentos), deve-se obrigatoriamente utilizar o **React Flow** (`@xyflow/react`):
- **Biblioteca Oficial**: `@xyflow/react`. PROIBIDO construir motores manuais de drag/pan/zoom do zero em novas implementações ou manter divergência entre telas de canvas.
- **Uniformidade Visual e Estrutural Inegociável**:
  1. **Container / Shell**: `relative overflow-hidden rounded-2xl border border-border bg-card shadow-xs`.
  2. **Background Padrão**: Fundo com grade de pontos semântica usando `<Background variant={BackgroundVariant.Dots} gap={24} size={1.2} />` ou radial dot grid semântico.
  3. **Barra Superior de Controles (Toolbar)**:
     - Esquerda: Ícone semântico do domínio + Título do Canvas + Contadores/Métricas consolidadas.
     - Direita: Controles de navegação (ZoomIn, ZoomOut, FitView) padronizados e `<MiniMap />` estilizado no canto inferior direito com `backdrop-blur` e borda suave.
  4. **Nós Customizados (Custom Node Types)**:
     - Todo nó deve ser registrado em `nodeTypes`.
     - Estilização obrigatória com `tailwind-variants` (`tv`), definindo slots (`card`, `topRow`, `title`, `meta`, `chips`) e variantes semânticas por disciplina/categoria (`ENGINEERING_CAD`, `FINANCE`, `MARKETING`, etc.).
     - ZERO cores hexadecimais diretas; utilizar apenas tokens semânticos (`border-primary`, `bg-card`, `text-foreground`, `text-muted-foreground`, etc.).
     - Conectores / Handles: `<Handle type="target" position={Position.Top} />` e `<Handle type="source" position={Position.Bottom} />` discretos e alinhados.
  5. **Arestas / Conexões (Edges)**:
     - Tipo `smoothstep` padronizado com stroke suave utilizando a variável do token de borda (`var(--border)`).
  6. **Alternador de Visualização Padrão**: Sempre que houver visualização tabular complementar, fornecer no topo um alternador padronizado em pílula (`Árvore (Canvas)` / `Tabela`) com o Canvas ativo por padrão.

## 6. Padrão de Alinhamento Perfeito de Labels e Inputs em Formulários
- **Zero desnível horizontal**: Em qualquer grid de formulário (`grid-cols-2`, `grid-cols-3`, `grid-cols-4`), os inputs vizinhos NUNCA devem ficar desalinhados horizontalmente devido ao tamanho do texto do label.
- **Padrão Obrigatório de Estrutura:**
  - Container de coluna: `flex flex-col justify-between space-y-1.5`.
  - Label: `text-xs font-semibold leading-tight min-h-[2rem] flex items-end`.
  - Campo/Input wrapper: `mt-auto`.
  ```tsx
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
    <div className="flex flex-col justify-between space-y-1.5">
      <Label htmlFor="custo" className="text-xs font-semibold leading-tight min-h-[2rem] flex items-end">
        Custo de Fabricação (R$)
      </Label>
      <div className="mt-auto">
        <Input id="custo" ... />
      </div>
    </div>
    <div className="flex flex-col justify-between space-y-1.5">
      <Label htmlFor="status" className="text-xs font-semibold leading-tight min-h-[2rem] flex items-end">
        Status de Entrega
      </Label>
      <div className="mt-auto">
        <Select id="status" ... />
      </div>
    </div>
  </div>
  ```

## 7. Minimalismo Visual: Proibição de Textos Didáticos Redundantes e Excesso de Badges (Zero Clutter)
- **Zero poluição textual**: Nunca poluir telas, modais e formulários com descrições teóricas, legendas didáticas ou tutoriais integrados. A interface deve ser direta e autoexplicativa.
- **Uso estrito de badges**: Proibido empilhar múltiplos badges ou chips decorativos. Badges são restritos a status funcionais e de ciclo de vida (ex: Ativo/Inativo, Bloqueado, Status de Tarefa).
- **Rótulos e Botões Concisos**: Utilizar termos curtos e objetivos (ex: `+ Novo Entregável` em vez de `+ Novo Entregável Raiz`).
