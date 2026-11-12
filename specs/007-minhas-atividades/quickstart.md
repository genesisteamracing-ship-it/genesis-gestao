# Quickstart & Validation Guide: Minhas Atividades e KPIs

**Feature**: `007-minhas-atividades` | **Date**: 2026-11-12

## 1. Pré-requisitos e Banco de Dados

Antes de aplicar a atualização de schema (`CANCELLED`, `completedAt`, `cancelledAt` em `prisma/schema.prisma`), execute obrigatoriamente o backup e o push seguro (conforme Regra 12 da Constituição):

```bash
cd stem-erp
npm run db:backup
npm run db:safe-push
npx prisma generate
```

## 2. Validações Automatizadas (Quality Gates)

Execute os três comandos de verificação contínua após implementar os módulos, hooks e componentes:

```bash
cd stem-erp
npx tsc --noEmit
npm run lint
npm test
```

Todos os testes unitários (cálculo de prazos, ordenação por urgência, fórmulas de KPI e schemas Zod), testes de hook/componente (`useMyActivities`, `MyActivitiesView`) e testes de integração de serviço devem passar com 0 falhas.

## 3. Validação Ponta a Ponta (Fluxos Principais)

1. **Acesso e Ordenação por Prazo**:
   - Autenticar como integrante com acesso ao módulo `tasks` e clicar em **Tarefas → Minhas atividades** (`/tarefas?tab=my-activities`) na barra lateral.
   - Confirmar exibição do `DashboardShell` com título `Minhas atividades` e subtítulo contextual.
   - Confirmar que apenas atividades atribuídas ao usuário aparecem e que itens atrasados vêm no topo com contagem de dias em atraso.
2. **Transição de Status**:
   - Na linha de uma atividade `A fazer`, abrir o seletor rápido ou menu de engrenagem e selecionar `Concluída` (ou `Cancelada`).
   - Recarregar a página (`F5`) e confirmar que o status persistiu e os KPIs no topo refletiram a alteração.
3. **KPIs e Filtros**:
   - Testar os filtros de status (`Todas`, `A fazer`, `Em andamento`, `Concluídas`, `Canceladas`), filtros de prazo (`Atrasadas`, `Esta semana`, `Próximos 15 dias`) e busca textual.
   - Verificar que a paginação mantém `10` itens por página com os 4 controles de navegação ativos.
4. **Modo Auditor & Mobile**:
   - Acessar com usuário `AUDITOR` e verificar bloqueio dos controles de edição.
   - Redimensionar para `375px` de largura e confirmar ausência de overflow horizontal e acessibilidade dos cards de KPI e menu gaveta.
