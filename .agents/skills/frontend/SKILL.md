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
