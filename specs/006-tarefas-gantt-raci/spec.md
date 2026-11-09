# Feature Specification: Tarefas por setor, Gantt e RACI

**Feature Branch**: `006-tarefas-gantt-raci`

**Created**: 2026-11-09

**Status**: Draft

**Input**: Criar tarefas por setor, gerar um Gantt visual, construir um caminho de risco visual e montar uma matriz RACI com o criador como A automático e um ou mais executores como R.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar tarefas e atribuir responsabilidades (Priority: P1)

Como integrante autorizado, quero cadastrar uma tarefa no setor responsável e atribuir sua execução a uma ou mais pessoas para que a equipe saiba quem responde pela entrega e quem a executa.

**Why this priority**: A tarefa e seus responsáveis dão origem às demais visões do módulo.

**Independent Test**: Criar uma tarefa, atribuir dois executores e verificar a mesma distribuição de papéis nos detalhes e na matriz RACI.

**Acceptance Scenarios**:

1. **Given** uma equipe ativa e um integrante com permissão de edição, **When** ele cria uma tarefa com título, setor e datas válidas, **Then** a tarefa aparece no setor escolhido, o autor é registrado como único A e a tarefa sem R fica sinalizada como pendente de atribuição.
2. **Given** uma tarefa sem R, **When** um editor atribui dois membros ativos da equipe como R e inclui um C e um I, **Then** a matriz exibe a tarefa em uma linha, as pessoas em colunas e os papéis nas células correspondentes, e a pendência de atribuição desaparece.
3. **Given** uma tarefa existente, **When** um editor altera seu estado ou remove todos os R, **Then** as visões exibem o novo estado ou a pendência de atribuição e mantêm o A original.
4. **Given** um auditor com acesso de leitura ou um usuário sem acesso ao módulo, **When** ele tenta alterar uma tarefa ou atribuição, **Then** a operação é negada. Usuários sem acesso também não podem consultar as visões do módulo.

### User Story 2 - Acompanhar o cronograma no Gantt (Priority: P2)

Como integrante da equipe, quero ver as tarefas em uma linha do tempo para identificar prazos, sobreposições e dependências entre setores.

**Why this priority**: O cronograma torna os prazos e a ordem das tarefas visíveis a partir dos dados já cadastrados.

**Independent Test**: Abrir o Gantt com tarefas de dois setores, incluindo tarefas simultâneas e uma dependência, e conferir as barras, a direção da ligação e o filtro por setor.

**Acceptance Scenarios**:

1. **Given** tarefas com datas e uma dependência cadastrada, **When** o usuário abre o Gantt, **Then** cada barra corresponde ao intervalo planejado, as datas e o estado são identificáveis e uma seta indica qual tarefa precede a outra.
2. **Given** tarefas em mais de um setor, **When** o usuário filtra o Gantt por setor, **Then** aparecem as tarefas desse setor e as dependências externas ao filtro ficam indicadas pelo nome da tarefa e do setor correspondente.
3. **Given** uma tarefa exibida no Gantt, **When** o usuário muda a escala de dias para semanas ou abre seus detalhes, **Then** a escala muda sem alterar as datas e os detalhes exibem setor, prazo, estado e responsáveis.

### User Story 3 - Construir e visualizar um caminho de risco (Priority: P3)

Como integrante autorizado, quero montar uma sequência de tarefas dependentes a partir de uma tarefa em risco para explicar quais entregas podem ser afetadas em caso de atraso.

**Why this priority**: O caminho torna visível como o problema em uma tarefa pode afetar atividades de outros setores.

**Independent Test**: Configurar A → B → C e A → D, salvar A → B → C como caminho de risco e verificar o diagrama e seu destaque no Gantt.

**Acceptance Scenarios**:

1. **Given** a cadeia A → B → C, **When** um editor nomeia o caminho, escolhe A como origem, informa o motivo e seleciona B e C na ordem das dependências, **Then** a sequência é salva e pode ser reaberta como um diagrama com setas da origem até a última tarefa.
2. **Given** um caminho salvo e outras tarefas fora dele, **When** o usuário ativa o destaque no Gantt sem filtro de setor, **Then** somente as tarefas e ligações do caminho recebem o destaque e as demais continuam visíveis como contexto.
3. **Given** um caminho salvo, **When** uma dependência do caminho é removida, **Then** a sequência fica marcada como incompleta, identifica a ligação ausente e perde o destaque até ser corrigida.
4. **Given** A → B → C, **When** um editor tenta salvar C → A ou uma sequência com tarefas sem dependência direta entre si, **Then** o sistema explica a inconsistência e mantém a configuração anterior.

### Edge Cases

- Uma tarefa de um dia aparece em um único dia no Gantt. Data de término anterior ao início impede o salvamento.
- O mesmo membro não pode ser incluído duas vezes no mesmo papel. Um integrante de outra equipe ou inativo não pode receber nova atribuição. A desativação de um integrante preserva as atribuições existentes e sinaliza sua condição.
- Dependências para a própria tarefa, duplicadas, entre equipes ou que fechem um ciclo são rejeitadas. Se as datas planejadas violarem uma dependência válida, a ligação permanece visível e o Gantt sinaliza o conflito de datas.
- Em um setor sem tarefas, o módulo explica que a seleção está vazia e oferece criação a quem pode editar. Sem dependências disponíveis, a visão de risco explica que é necessário vincular pelo menos duas tarefas.
- Em telas estreitas, a escala e os diagramas podem ser navegados dentro da própria visualização. O usuário também pode consultar tarefas e a sequência do caminho em formato textual por teclado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — O módulo DEVE permitir criar, consultar e editar tarefas. Cada tarefa pertence a uma equipe e a um setor existente dessa equipe e exige título, data de início e data de término. A descrição é opcional. O estado inicial é A fazer e pode mudar para Em andamento ou Concluída.
- **FR-002** — Ao salvar uma nova tarefa, o sistema DEVE registrar a pessoa autenticada que a criou como seu único **A (quem responde pela entrega)**. A edição da tarefa ou dos demais papéis DEVE preservar esse vínculo.
- **FR-003** — O módulo DEVE permitir que um editor atribua um ou mais **R (quem executa)** a cada tarefa, na criação ou depois. Uma tarefa com zero R permanece visível com a indicação “Sem executor”. Também deve permitir **C (quem é consultado)** e **I (quem é informado)** opcionais.
- **FR-004** — A matriz RACI DEVE mostrar tarefas em linhas, membros em colunas, letras dos papéis em cada célula e uma legenda. Um filtro por setor da tarefa DEVE estar disponível na lista, na matriz e no Gantt.
- **FR-005** — O módulo DEVE gerar o Gantt a partir das datas salvas, com barras em escala de dias ou semanas, nomes e setores das tarefas, indicações de estado, dependências direcionais e acesso aos detalhes. Alterações salvas devem aparecer nas visões sem redigitação.
- **FR-006** — Editores DEVEM poder adicionar e remover dependências dentro da equipe, inclusive entre setores. Uma dependência indica que a sucessora pode iniciar no primeiro dia após o término planejado da predecessora. Dependências inválidas DEVEM ser rejeitadas e conflitos entre datas e dependências válidas DEVEM ser sinalizados.
- **FR-007** — Editores DEVEM poder criar, salvar e editar caminhos de risco com nome, motivo e uma sequência ordenada de pelo menos duas tarefas ligadas por dependências diretas no sentido predecessora → sucessora. Quando uma ligação usada deixa de existir, o caminho salvo DEVE ser marcado como incompleto e identificar a ligação ausente.
- **FR-008** — A visão do caminho de risco DEVE mostrar as tarefas como nós com nome e setor, setas com direção, origem identificada e motivo do risco. O usuário DEVE poder destacar um caminho válido por vez no Gantt. Estado, direção e destaque DEVEM ser identificáveis por texto ou formas além da cor. As duas visualizações DEVEM oferecer acesso às informações essenciais por teclado e em telas estreitas.
- **FR-009** — O módulo DEVE respeitar as permissões vigentes por equipe e por módulo. Auditores com acesso têm somente leitura. Consultas, atribuições e dependências DEVEM ficar limitadas à equipe ativa autorizada, inclusive quando o usuário tenta abrir diretamente um item de outra equipe.

### Key Entities *(include if feature involves data)*

- **Tarefa** — Atividade de uma equipe e um setor, com título, descrição opcional, datas planejadas, estado e autor.
- **Atribuição RACI** — Papel de um integrante em uma tarefa. Cada tarefa tem um único A automático e pode ter vários R, C e I.
- **Dependência** — Vínculo dirigido entre uma tarefa predecessora e uma sucessora da mesma equipe.
- **Caminho de risco** — Sequência nomeada de tarefas e dependências selecionadas por um editor, com origem e motivo registrados.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Em teste com pelo menos cinco integrantes, quatro conseguem cadastrar uma tarefa no setor correto e atribuir dois executores em até dois minutos, sem ajuda.
- **SC-002** — Em todos os cenários de criação e edição, a matriz mostra exatamente um A correspondente ao criador e todos os R salvos. Tarefas sem R são identificáveis na lista e na matriz.
- **SC-003** — Em um cronograma de 50 tarefas distribuídas em cinco setores, as barras, datas e dependências coincidem com os dados salvos, e o filtro ou a troca de escala responde em até dois segundos em pelo menos 95% das interações em condições normais de uso.
- **SC-004** — Em teste com pelo menos cinco integrantes, quatro identificam em até 30 segundos a origem do risco e quais tarefas compõem um caminho de quatro etapas, usando o diagrama ou o Gantt. O mesmo caminho pode ser consultado por teclado e em uma tela de 375 px de largura.

## Assumptions

- Os setores e membros cadastrados no Genesis Gestão são a referência. O setor classifica a tarefa. Integrantes ativos de outros setores da mesma equipe podem receber papéis RACI, conforme as permissões do módulo.
- O criador permanece como A nesta primeira versão, inclusive se for desativado. A versão inicial admite cadastro antes da escolha de um R e sinaliza a pendência.
- “Caminho de risco” é uma sequência escolhida pelo usuário para comunicar impactos potenciais. Cálculo automático de caminho crítico, folgas, risco probabilístico e reagendamento automático ficam fora desta versão.
- O cronograma usa dias corridos e datas inclusivas. A WBS existente continua sendo a visão de entregáveis. Vínculos entre tarefas e itens da WBS, notificações e exportações ficam fora desta versão.
