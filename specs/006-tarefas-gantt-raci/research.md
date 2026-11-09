# Pesquisa técnica — Tarefas por setor, Gantt e RACI

## 1. Integração com o ERP e controle de acesso

**Decisão** — Criar a rota `/tarefas` e a permissão independente `tasks`. Reusar os setores de `DeliveryGroup`, as respectivas legendas e a arquitetura de sessão, permissões e navegação do ERP. A permissão nasce desabilitada para não administradores, inclusive contas legadas, e pode ser concedida no painel existente. Auditores autorizados têm leitura. O serviço resolve e valida a equipe no servidor. Mutações exigem um membro ativo da equipe, inclusive para quem tem papel global.

**Justificativa** — Setor organiza o trabalho. O acesso continua sendo por equipe e por módulo. O fallback para a primeira equipe de `stem-erp/src/services/financial-service.ts` atende ao contexto financeiro e não deve autorizar o módulo de tarefas. `stem-erp/src/lib/permissions.ts`, `stem-erp/src/services/auth-service.ts` e `stem-erp/src/actions/wbs.actions.ts` orientam a integração. Cada ação exposta revalida sessão, permissão e escopo. [Segurança de dados no Next.js](https://nextjs.org/docs/app/guides/data-security)

**Alternativas consideradas** — Embutir tarefas em Documentos acoplaria a permissão da EAP à edição do cronograma. Atribuir acesso automaticamente a toda a base eliminaria a decisão de habilitação por equipe.

## 2. RACI e histórico de membros

**Decisão** — Derivar o único A de um vínculo histórico imutável com o criador. Persistir R, C e I em linhas por pessoa e papel. Guardar ID estável e nome mínimo de referência, com vínculo de usuário anulável na exclusão. Validar equipe e atividade para novas atribuições. Atualizar a tarefa e as atribuições solicitadas em uma transação.

**Justificativa** — Um A derivado elimina a possibilidade de dois A ou da remoção acidental do papel. `stem-erp/src/services/auth-service.ts` já permite excluir usuários. Preservar o histórico evita bloquear a exclusão ou perder responsáveis. Uma pessoa pode ter mais de um papel distinto, inclusive A e R.

**Alternativas consideradas** — Tratar A como qualquer papel exigiria validações adicionais de unicidade e imutabilidade. Uma chave estrangeira obrigatória para usuário bloquearia a exclusão ou apagaria o histórico por cascata.

## 3. Dias de calendário e Gantt

**Decisão** — Usar datas civis `YYYY-MM-DD` no formulário e nos contratos, `DateTime @db.Date` no Prisma e aritmética de dias em UTC. O Gantt terá grade rolável, barras posicionadas por dia e setas em camada SVG. A escala semanal muda as marcações e a densidade, preservando o intervalo de cada barra.

**Justificativa** — Um dia ocupa uma célula, e a duração inclusiva é fim menos início mais um. A validação estrita rejeita datas inexistentes e permite início igual ao fim. `stem-erp/src/lib/season.ts` e `stem-erp/src/lib/communication-schedule.ts` fornecem referências de UTC, mas as regras de temporada não permitem reaproveitamento direto para tarefas de um dia. A grade preserva alinhamento entre nomes, intervalos e dependências sem exigir outra biblioteca de cronograma.

**Alternativas consideradas** — Armazenar horários locais expõe o Gantt a deslocamentos de data. Usar o canvas de grafo como escala temporal adicionaria um viewport ao conteúdo que precisa acompanhar cabeçalho e linhas. Um pacote Gantt exigiria integração adicional com acessibilidade, setas e tokens do ERP.

## 4. Dependências e caminhos concorrentes

**Decisão** — Salvar dependências direcionais únicas e armazenar as etapas dos caminhos separadamente, em ordem. Validar ciclos e pares consecutivos no servidor. Executar mutações de dependência e caminho sob isolamento serializável, com novas tentativas limitadas para conflitos de serialização. A leitura deriva quais ligações estão faltando e se o caminho pode ser destacado.

**Justificativa** — Duas inserções concorrentes podem fechar um ciclo mesmo que cada validação isolada passe. Manter as etapas independentes das arestas permite remover uma dependência e ainda explicar qual ligação precisa ser restaurada. [Transações no Prisma ORM 6](https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions)

**Alternativas consideradas** — Validar só no cliente permitiria inconsistências com requisições simultâneas. Apagar etapas em cascata destruiria a sequência salva. Persistir uma flag de validade exigiria atualizá-la em toda mutação da rede.

## 5. Diagrama de risco acessível

**Decisão** — Reusar `stem-erp/src/components/canvas/flow-canvas-shell.tsx` e os padrões de `stem-erp/src/components/wbs/wbs-flow-canvas.tsx` e `wbs-flow.adapter.ts`. Usar nós em ordem, setas direcionais, controles do canvas compartilhado e sequência textual equivalente. Montar e corrigir o caminho em seletor ordenado que oferece sucessoras válidas.

**Justificativa** — A sequência tem ordem de negócio, por isso o layout pode ser determinístico. A edição por controles de formulário funciona por teclado e em telas pequenas. O diagrama mantém a mesma gramática visual da EAP. [Acessibilidade no React Flow](https://reactflow.dev/learn/advanced-use/accessibility)

**Alternativas consideradas** — Um editor exclusivamente por arraste dificultaria a construção por teclado. Um layout automático de grafo geral seria desnecessário para uma sequência linear.

## 6. Validação e publicação

**Decisão** — Manter `tsx --test` para regras puras, adicionar testes de componente com Testing Library e Playwright para jornadas desktop e mobile, e usar PostgreSQL isolado para concorrência e escopo. Gerar uma alteração aditiva no schema e aplicar apenas pelo fluxo de backup e sincronização segura do repositório.

**Justificativa** — O manifesto e `.github/workflows/ci.yml` já definem lint, checagem de tipos, testes e build. Não existe suíte Playwright configurada no checkout. Os comandos novos serão entregues na implementação. [CLI do Playwright](https://playwright.dev/docs/test-cli)

**Alternativas consideradas** — Usar apenas testes unitários deixaria de cobrir teclado, geometria visual e transações concorrentes reais. Usar produção para validação misturaria cenários de teste aos dados da equipe.

Pendências técnicas para o planejamento foram resolvidas. A verificação da versão instalada do Next.js e a execução dos testes pertencem à implementação.
