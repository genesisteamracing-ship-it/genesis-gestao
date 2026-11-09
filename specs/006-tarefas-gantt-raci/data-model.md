# Modelo de dados — Tarefas, dependências e caminhos de risco

## Task

| Campo | Semântica |
| --- | --- |
| `id`, `teamId` | Identidade e equipe proprietária. Toda consulta e mutação é escopada pela equipe. |
| `deliveryGroup` | Setor do catálogo `DeliveryGroup` do ERP. |
| `title`, `description?` | Título obrigatório e descrição opcional. |
| `startDate`, `endDate` | Datas civis inclusivas em PostgreSQL `DATE`. Validar formato, calendário e início ≤ término. |
| `status` | A fazer por padrão, Em andamento ou Concluída. Edições autorizadas podem selecionar qualquer estado, inclusive reabertura. |
| `creatorKey`, `creatorName`, `creatorUserId?` | ID histórico e nome do autor, com relação opcional ao usuário ativo ou inativo. A relação pode ficar nula após exclusão. O papel A vem sempre deste vínculo histórico. |
| `createdAt`, `updatedAt` | Datas de auditoria. Usar revisão da tarefa na edição para detectar formulário desatualizado, inclusive quando só mudam atribuições. |

Indexar equipe e setor para lista e matriz. O servidor registra como autor o usuário autenticado com acesso de escrita à equipe ativa, inclusive o superadministrador que a selecionou. A autoria fica fora do contrato de edição.

## TaskAssignment

- Identidade de equipe e tarefa, `memberKey`, `memberName`, relação opcional `userId` e papel R, C ou I. Chave única por tarefa, membro histórico e papel.
- Novos papéis exigem membro ativo da equipe. Ao editar, comparar com as atribuições atuais. Preservar vínculos inativos ou excluídos mantidos no envio e permitir remoção explícita. Um membro pode ter papéis distintos.
- Exibir o nome atual somente se o usuário ainda pertence à equipe. Usar o nome histórico e indicar indisponibilidade caso tenha saído ou sido excluído. Membro inativo permanece identificável. Não armazenar e-mail.
- Uma tarefa sem nenhuma atribuição R é projetada como “Sem executor”. Uma tarefa com R indisponível identifica esse estado, preservando o vínculo.
- Gravar o cadastro com os papéis iniciais e cada edição com a mudança de papéis solicitada em uma única transação.

## TaskDependency

- `teamId`, `predecessorId`, `successorId` e data de criação. Chave única por equipe e par dirigido. Indexar buscas por sucessora e predecessora.
- Ambas as tarefas devem pertencer à equipe da dependência. Rejeitar autorreferência, par repetido e inclusão que torne a predecessora alcançável a partir da sucessora.
- Conflito temporal é derivado quando início da sucessora é menor ou igual ao término da predecessora. A edição das datas não altera a aresta.
- A exclusão de uma aresta remove apenas a dependência. As etapas de caminhos permanecem.

## RiskPath e RiskPathStep

- `RiskPath` guarda `id`, `teamId`, nome, motivo e datas de criação e revisão.
- `RiskPathStep` guarda `teamId`, caminho, posição e tarefa. A posição é única por caminho e a mesma tarefa não se repete. A primeira é a origem. Cada caminho tem duas ou mais etapas.
- Ao criar ou editar, validar a existência de uma aresta direta para cada par consecutivo e gravar o conjunto ordenado atomicamente. Quando uma aresta é removida depois, derivar a lista de pares ausentes. Restaurar a mesma ligação volta a tornar válido um caminho cujas demais ligações seguem presentes.
- A projeção de destaque usa o conjunto de tarefas e os pares consecutivos do caminho válido. Uma aresta entre tarefas do caminho que não seja um desses pares fica fora do destaque.

## Integridade, concorrência e recuperação

- Restringir relações entre entidades do módulo à mesma equipe com chaves compostas em equipe/ID. Usuários são validados por equipe na escrita e na projeção. Preservar snapshots de nome e ID estável quando a relação com o usuário ficar nula.
- Em mutações de dependência e caminho, usar transação serializável e repetir a transação completa somente em conflitos de serialização/deadlock identificados pelo Prisma. Após o limite, retornar erro recuperável. Uma validação de negócio negada não deve ser repetida.
- Usar leitura consistente das dependências e etapas para que a validade e o destaque venham da mesma versão do grafo. Edições de formulário desatualizado retornam conflito e não sobrescrevem alterações mais novas.
- Incluir os novos modelos no backup e na recuperação do ERP. Tratar snapshots anteriores, que não incluem essas coleções, sem apagar dados de tarefas. A aplicação do schema é aditiva e deve ser validada antes em ambiente isolado.
