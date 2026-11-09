# Validação — Módulo Tarefas

Este roteiro valida o módulo em um ambiente local isolado.

## Ambiente e preparo

1. Use Node.js 20 conforme a CI e um PostgreSQL local isolado com banco vazio `tasks_test`. Configure `TASKS_TEST_DATABASE_URL` e `TASKS_TEST_AUTH_SECRET` (ao menos 32 caracteres). Use essa mesma URL em `DATABASE_URL` e `DATABASE_URL_UNPOOLED` e esse mesmo segredo em `AUTH_SECRET`. A suíte de navegador cria equipes e contas de teste próprias para desktop e mobile.
2. Antes de alterar o schema, siga a regra do repositório e confirme o backup com `npm run db:backup`. Esse fluxo sincroniza a branch de recuperação do Neon.
3. Para testes, execute `npm run db:safe-push -- --local-test` dentro de `stem-erp`. Esse modo aceita somente o banco `tasks_test` em loopback, gera o snapshot local e aplica o schema pelo caminho protegido. Para produção, use `npm run db:safe-push` com a configuração de produção verificada antes de ativar a versão no Render. O build do Render não executa mais a aplicação de schema.
4. Na pasta `stem-erp`, após provisionar o banco e preparar as fixtures, execute:

```powershell
npm ci
npx prisma generate
npm run dev
```

Abra `http://localhost:3000/tarefas`. Prepare uma equipe com permissões concedidas, pelo menos dois executores ativos, um auditor e setores diferentes. Prepare uma segunda equipe para verificar isolamento.

## Cenários de aceitação

| Cenário | Ação | Resultado esperado |
| --- | --- | --- |
| Criação e RACI | Crie tarefa de um dia sem executor. Edite e inclua dois R, um C e um I. Reabra a matriz. | O autor permanece único A. “Sem executor” desaparece. O filtro usa o setor da tarefa. |
| Histórico | Desative um membro de teste com atribuição e consulte a matriz. Use fixture descartável para testar a exclusão física. | A atribuição existente aparece como indisponível, com nome histórico quando aplicável. A lista de novos responsáveis omite esse membro. |
| Gantt | Crie A → B entre setores. Confira barras e setas nas duas escalas. Filtre por um setor. Edite B para iniciar no mesmo dia em que A termina. | A tarefa de um dia ocupa um dia. A escala mantém datas. O filtro identifica a ponta externa. A alteração de B mostra conflito de datas e preserva a ligação. |
| Caminho de risco | Cadastre B → C e A → D. Salve A → B → C. Destaque no Gantt, remova B → C e reabra. Restaure B → C. | O destaque ignora A → D. O caminho incompleto aponta B → C e perde o destaque. Ao restaurar a ligação, o caminho volta a ser elegível. |
| Integridade | Tente C → A, uma sequência descontínua, uma dependência repetida e duas arestas recíprocas simultâneas em tarefas novas. | Alterações inválidas deixam a versão anterior intacta. No teste concorrente, no máximo uma das arestas é confirmada. |
| Permissões | Consulte e tente escrever como auditor. Abra o módulo sem permissão. Tente consultar e atribuir IDs de outra equipe. | Auditor autorizado só consulta. Acesso sem permissão ou a outra equipe não revela registros. |
| Acessibilidade | Use teclado em desktop e viewport de 375 px. Abra detalhes de uma barra e consulte a sequência textual de risco. | Foco visível e controles acessíveis. Os diagramas rolam dentro de seus limites. Estado, sentido e destaque podem ser entendidos sem cor. |

## Gates automatizados

Na pasta `stem-erp`, execute após a implementação:

```powershell
npm run lint
npm test
npx tsc --noEmit
npm run build
npx playwright install chromium
npx playwright test
```

- A suíte de regras deve cobrir datas inválidas, bissexto, mês e ano, barra inclusiva, papéis duplicados e A imutável, conflito de datas e ciclo.
- A suíte de integração deve usar o banco isolado para transações concorrentes, isolamento entre equipes, autoria preservada, alteração de permissão e rejeição de versão desatualizada. A suíte de componentes deve usar nomes e papéis acessíveis para validar interações e estados.
- O Playwright executa os cenários desktop e mobile e usa fixtures de teste separadas para cada viewport. Confira a navegação e a cadeia visual A → B → C nos dois projetos.
- Para SC-003, use 50 tarefas em cinco setores, registre viewport e ambiente e meça filtro e troca de escala depois de carregar a visão. Verifique o limite de dois segundos para pelo menos 95% das interações. Para SC-001 e SC-004, use a amostra e os tempos definidos na [especificação](spec.md#measurable-outcomes).

Na entrega da implementação, confirme os gates, faça o commit e integre a branch remota com `git pull` antes do push.
