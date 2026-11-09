# Implementation Plan: Tarefas por setor, Gantt e RACI

**Branch** — `006-tarefas-gantt-raci` | **Date** — 2026-11-09 | **Spec** — [spec.md](spec.md)

**Input** — A especificação da feature `006-tarefas-gantt-raci`.

## Summary

Adicionar o módulo autenticado `/tarefas`, com cadastro por setor, matriz RACI, cronograma de Gantt e caminhos de risco escolhidos pela equipe. Persistir as tarefas, papéis, dependências e etapas em PostgreSQL. Derivar as quatro visões dos mesmos registros, com A calculado a partir do autor, Gantt baseado em datas de calendário e diagrama de risco no canvas compartilhado.

## Technical Context

- **Language/Version** — TypeScript 5 em modo estrito, Node.js 20 conforme CI, React 19 e Next.js 16.4.3 conforme o manifesto. Consultar os guias da versão instalada em `node_modules/next/dist/docs/` antes de implementar.
- **Primary Dependencies** — Prisma 6, Zod, shadcn/ui, Tailwind CSS 4, tailwind-variants, TanStack Table e `@xyflow/react`. A implementação adicionará apenas as dependências de teste ausentes necessárias para Testing Library e Playwright.
- **Storage** — PostgreSQL no Neon. Schema aditivo e datas de calendário no tipo `DATE`. PostgreSQL isolado para testes.
- **Testing** — `npm test` com `tsx --test`, testes de componentes, integração com banco e Playwright para desktop e mobile. [Roteiro](quickstart.md)
- **Target Platform** — Navegadores desktop e mobile. Aplicação e deploy do ERP em Render.
- **Project Type** — Módulo web integrado ao App Router e à camada de serviços existente.
- **Performance Goals** — No cenário de 50 tarefas e cinco setores, pelo menos 95% das interações de filtro ou escala em até dois segundos. Medir em navegador com fixture controlada.
- **Constraints** — Isolamento por equipe, autorização por módulo, auditor somente leitura, A imutável, integridade das dependências concorrentes, escala inclusiva e acesso visual e textual. Aplicação de schema exclusivamente pelo fluxo de backup e sincronização segura.
- **Scale/Scope** — Cadastro e edição de tarefas, RACI, Gantt e caminho de risco. Cálculo de caminho crítico, integração WBS, notificações, exportação e reagendamento ficam fora deste recorte.

## Constitution Check

| Regra | Antes da pesquisa | Após o desenho |
| --- | --- | --- |
| Arquitetura e tipagem | UI apresenta dados. Serviços centralizam escopo e regras de domínio. Zod valida entradas. | Atendida pelo contrato de ações tipadas, projeções e mutações atômicas. |
| Design System e layout | `DashboardShell`, tokens semânticos, shadcn/ui e variantes com `tv`. | Atendida com tabs contextuais, canvas React Flow compartilhado, grid de Gantt rolável, matriz e lista com paginação fixa de dez itens. |
| Qualidade, acessibilidade e testes | Planejar testes de domínio, componentes, segurança, integração e E2E. | Atendida no desenho. O quickstart inclui teclado, viewport mobile, datas civis e gravações concorrentes. Gates executáveis ficam para a implementação. |
| Isolamento e auditoria | Exigir equipe ativa e permissão no servidor. | Atendida no desenho. Atribuições mantêm autoria histórica, e o escopo é aplicado em cada leitura e mutação. |
| Dados e publicação | Backup antes de alterar o schema, aplicação protegida e pull antes de push. | Gate de implementação explícito. Verificar sucesso real do backup e remover a aplicação direta do schema pelo Render para esta entrega antes de implantar. [Roteiro](quickstart.md) |

## Project Structure

### Documentation (this feature)

```text
specs/006-tarefas-gantt-raci/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   └── tarefas.md
└── quickstart.md
```

### Source Code (repository root)

```text
stem-erp/
├── prisma/schema.prisma
├── scripts/db-{backup-sync,restore-snapshot,safe-migrate}.ts
├── src/
│   ├── app/tarefas/
│   ├── actions/tasks.actions.ts
│   ├── components/{tasks,canvas,layout,permissions}/
│   ├── hooks/
│   ├── lib/{permissions.ts,validations/}
│   ├── services/{auth-service.ts,task-service.ts}
│   └── types/{auth.ts,tasks.ts}
└── e2e/
render.yaml
```

**Structure Decision** — Manter o módulo dentro de `stem-erp`. A rota inicial carrega o contexto autorizado no servidor. Ações delegam validações transacionais ao serviço, e componentes usam adaptadores puros para a matriz, o Gantt e o caminho. Reusar a navegação de desktop e mobile e o painel de permissões.

## Implementation Sequence

1. **Fundação e história 1.** Preparar o fluxo protegido de schema, autorização, cadastros, RACI e testes de isolamento. Entregar a criação com A automático e a atribuição posterior de vários R.
2. **História 2.** Implementar datas civis, gestão de dependências, projeção do Gantt, filtro por setor, escala e indicadores de conflito ou destino fora do filtro.
3. **História 3.** Implementar editor de sequência, projeção do diagrama, lista textual e destaque coordenado com o Gantt. Cobrir perda e restauração de ligação.
4. **Validação final.** Executar os gates e o roteiro em ambiente isolado, com amostra representativa para desempenho. Publicar a implementação somente após integrar a branch remota com `git pull`.

**Design artifacts** — [Pesquisa](research.md) · [Modelo de dados](data-model.md) · [Contrato](contracts/tarefas.md) · [Validação](quickstart.md)
