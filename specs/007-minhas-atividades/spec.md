# Feature Specification: Painel de Minhas Atividades e KPIs de Desempenho Individual

**Feature Branch**: `007-minhas-atividades`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "Preciso adicionar uma parte para os usuarios verem Minhas atividades e lá vai está todas as atividades, onde eles podem assinalar as atividades como feito a fazer, cancelada. Eles conseguem ver todas as atividades atribuidas a eles, por tempo de limite para finalização. Também tem kpis de desempenho deles."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualização e Acompanhamento por Prazo Limite (Priority: P1)

Como integrante da equipe autenticado no sistema, quero acessar uma área centralizada de "Minhas Atividades" para consultar todas as atividades atribuídas a mim, organizadas e ordenadas pelo tempo restante até o prazo limite de finalização, para priorizar meu trabalho diário sem risco de perder prazos.

**Why this priority**: É a jornada principal de valor imediato do usuário. Permitir que o integrante localize e veja suas pendências organizadas por urgência resolve o problema de esquecimento e falta de clareza de prazos.

**Independent Test**: Acessar o sistema com um usuário que possui atividades com diferentes datas de entrega (atrasadas, hoje, próximos dias e futuras) e verificar se a listagem exibe todas elas agrupadas ou ordenadas por proximidade do prazo limite, com indicação clara do tempo restante.

**Acceptance Scenarios**:

1. **Given** um integrante com tarefas atribuídas na equipe ativa, **When** ele acessa a tela "Minhas Atividades", **Then** o sistema exibe apenas as atividades nas quais o usuário autenticado figura como responsável/executor, ordenadas do menor para o maior tempo limite de entrega (mais urgentes primeiro).
2. **Given** atividades com prazo vencido e status não finalizado, **When** o usuário visualiza o painel, **Then** essas atividades recebem destaque visual de alerta ("Em Atraso") indicando há quantos dias o prazo expirou.
3. **Given** atividades com prazo para a data corrente ou próximos 7 dias, **When** o usuário consulta a lista, **Then** o sistema apresenta a contagem regressiva de tempo limite ("Vence hoje", "Vence em X dias").
4. **Given** filtros temporais e de busca disponíveis no painel, **When** o usuário filtra por "Atrasadas", "Esta Semana" ou busca por título, **Then** a visualização se ajusta instantaneamente mantendo a paginação e a contagem de registros consistentes.

---

### User Story 2 - Transição e Atualização de Status da Atividade (Priority: P2)

Como executor de uma atividade, quero atualizar o estado de execução diretamente pela visualização de Minhas Atividades (alternando entre A Fazer, Em Andamento, Concluída/Feito e Cancelada) de forma rápida e intuitiva, para manter o progresso do projeto sincronizado em tempo real.

**Why this priority**: É a ação central de interação e produtividade do integrante. Se o usuário não puder atualizar o status no próprio painel, o fluxo de trabalho se fragmenta.

**Independent Test**: Selecionar uma atividade com status "A Fazer", alterá-la para "Concluída" e depois outra para "Cancelada", verificando se a alteração persiste, se atualiza o estado em todo o sistema e se move a atividade para o agrupamento correspondente.

**Acceptance Scenarios**:

1. **Given** uma atividade no estado "A Fazer" ou "Em Andamento", **When** o usuário clica para marcar como "Concluída / Feito", **Then** o estado da atividade muda para concluída, a data de finalização é registrada e ela é reclassificada na lista.
2. **Given** uma atividade que foi descontinuada ou não é mais necessária, **When** o usuário seleciona o status "Cancelada", **Then** a atividade é marcada como cancelada, deixa de contar como pendência urgente e exibe o rótulo de cancelamento.
3. **Given** uma atividade marcada por engano como concluída ou cancelada, **When** o executor optar por reabrir ou retornar para "A Fazer", **Then** o sistema permite a reversão de forma segura, restabelecendo o fluxo de trabalho.
4. **Given** um usuário com perfil de apenas leitura (Auditor), **When** ele visualiza a tela, **Then** os controles de alteração de status permanecem desabilitados com indicação de permissão insuficiente.

---

### User Story 3 - KPIs de Desempenho e Produtividade Individual (Priority: P3)

Como integrante da equipe, quero visualizar métricas e indicadores de desempenho (KPIs) sobre minhas próprias entregas no topo da tela, para monitorar minha produtividade, índice de pontualidade e carga de trabalho na temporada.

**Why this priority**: Fornece senso de realização e visibilidade sobre a eficiência do membro, estimulando o cumprimento de metas e permitindo autoavaliação contínua.

**Independent Test**: Calcular a taxa de entrega e pontualidade de um usuário com 10 tarefas (6 concluídas no prazo, 2 concluídas com atraso, 1 em andamento e 1 cancelada) e verificar se os cards de KPI exibem com exatidão a taxa de conclusão, total pendente e taxa de pontualidade.

**Acceptance Scenarios**:

1. **Given** o histórico de atividades do usuário logado na temporada ativa, **When** a página "Minhas Atividades" carrega, **Then** são exibidos cards de indicadores consolidados no topo: Total Atribuído, Concluídas, Pendentes / Em Andamento, Atrasadas e Taxa de Pontualidade / Conclusão no Prazo.
2. **Given** um usuário que conclui uma atividade pendente dentro do prazo, **When** o status é alterado, **Then** os contadores de concluídas e os índices de taxa de pontualidade são recalculados e atualizados imediatamente na interface.
3. **Given** um usuário recém-ingressado na equipe sem tarefas atribuídas, **When** ele entra na tela, **Then** os KPIs exibem valores zerados neutros acompanhados de uma mensagem de estado vazio convidativa ("Você não possui atividades atribuídas no momento").

---

### Edge Cases

- **Atividade com múltiplos executores**: Quando uma atividade possui mais de um membro atribuído, a alteração de status efetuada por um executor reflete para a atividade como um todo, notificando visualmente o estado compartilhado.
- **Atividades sem prazo de término definido**: Caso alguma atividade legada ou específica não possua prazo limite estipulado, ela é listada em uma seção dedicada ("Sem prazo limite definido"), sem impactar negativamente o cálculo de atraso.
- **Conclusão de atividade em atraso**: Uma atividade finalizada após a data limite é registrada com sucesso como "Concluída", porém contabilizada no histórico de KPIs como "Entrega com Atraso", preservando a métrica de pontualidade histórica.
- **Navegação mobile e touch**: Em telas compactas de smartphones, os seletores de status devem oferecer alvos de toque acessíveis (mínimo de 44x44 px) e os cartões de KPI devem se reorganizar em grid responsiva sem corte de texto ou transbordamento horizontal.
- **Troca de equipe ou temporada**: Ao alternar a equipe ou temporada no seletor global do sistema, o painel de "Minhas Atividades" e os KPIs devem ser recarregados imediatamente com o escopo exclusivo da equipe ativa selecionada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE fornecer uma visão dedicada "Minhas Atividades" acessível pelo menu de navegação principal da equipe ativa.
- **FR-002**: O sistema DEVE filtrar automaticamente para exibir apenas as atividades nas quais o usuário autenticado esteja atribuído como executor ou responsável direto.
- **FR-003**: A listagem de atividades DEVE ordenar por padrão as tarefas de acordo com o prazo limite de finalização, priorizando itens em atraso seguidos por itens que vencem na data atual e nos dias subsequentes.
- **FR-004**: O sistema DEVE calcular e exibir o tempo relativo restante para cada atividade não finalizada (ex: "Atrasada há 2 dias", "Vence hoje", "Vence em 3 dias", "Vence em 2 semanas").
- **FR-005**: O sistema DEVE permitir a alteração direta do status da atividade pelo usuário atribuído, contemplando os estados: A Fazer, Em Andamento, Concluída / Feito e Cancelada.
- **FR-006**: Ao assinalar uma atividade como Concluída ou Cancelada, o sistema DEVE registrar a data/hora do evento para fins de histórico e cálculo de métricas.
- **FR-007**: O sistema DEVE exibir um bloco de KPIs de Desempenho Individual contendo no mínimo:
  - Total de Atividades Atribuídas
  - Atividades Concluídas (e percentual de conclusão)
  - Atividades Pendentes (A Fazer / Em Andamento)
  - Atividades em Atraso (que ultrapassaram o prazo limite sem conclusão)
  - Taxa de Pontualidade (% de tarefas entregues até o prazo final estipulado)
- **FR-008**: O sistema DEVE disponibilizar filtros por estado (Todas, A Fazer, Em Andamento, Concluídas, Canceladas) e por faixa de prazo (Todas, Atrasadas, Esta Semana, Próximos 15 dias), além de campo de busca textual por título ou descrição.
- **FR-009**: O sistema DEVE respeitar o controle de acesso e permissões (RBAC): membros com permissão de edição podem alterar o status de suas próprias tarefas; membros com papel de Auditor ou visualizador possuem acesso estritamente somente leitura.
- **FR-010**: A tabela ou lista de atividades DEVE respeitar os padrões de usabilidade e interface do sistema: paginação padronizada fixa em 10 itens por página com 4 controles de navegação, e menu de engrenagem para ações secundárias por linha.

### Key Entities *(include if feature involves data)*

- **Atividade / Tarefa Pessoal**: Representa a unidade de trabalho sob responsabilidade do integrante. Possui título, descrição opcional, data de início, data limite de finalização (prazo), setor/área responsável e status atual.
- **Status da Atividade**: Estado do ciclo de vida da atividade, categorizado entre: A Fazer (pendente inicial), Em Andamento (trabalho iniciado), Concluída (finalizada com sucesso) e Cancelada (descontinuada/abortada).
- **Atribuição do Integrante**: Vínculo entre a atividade e o integrante autenticado, qualificando seu papel como executor da entrega.
- **Indicadores de Desempenho (KPIs do Integrante)**: Métricas consolidadas calculadas em tempo real para o usuário na temporada ativa: volume de entregas, índice de pontualidade percentual e taxa de atividades em conformidade.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário consegue visualizar todas as suas atividades atribuídas e identificar claramente quais estão atrasadas ou vencendo hoje em menos de 3 segundos após abrir a página.
- **SC-002**: A ação de atualizar o status de uma atividade (ex: de "A Fazer" para "Concluída" ou "Cancelada") é concluída com no máximo 2 cliques ou toques na tela e confirmação visual imediata.
- **SC-003**: Os KPIs individuais de desempenho (conclusão, atraso e taxa de pontualidade) são calculados e exibidos de forma determinística, apresentando 100% de consistência aritmética com os dados reais de tarefas cadastradas.
- **SC-004**: 95% dos integrantes avaliados em testes de usabilidade conseguem localizar suas tarefas prioritárias da semana e atualizar o status sem necessidade de tutorial ou suporte.
- **SC-005**: A interface do painel e o bloco de KPIs operam com total usabilidade e sem quebras visuais em telas móveis a partir de 320 px de largura.

## Assumptions

- O usuário já se encontra autenticado e possui uma equipe ativa selecionada no sistema.
- As atividades exibidas têm como fonte de dados as tarefas geradas no módulo de gerenciamento de tarefas e projetos da equipe.
- A inclusão do status "Cancelada" amplia os estados existentes da tarefa sem quebrar fluxos anteriores de cronograma e matriz de papéis (Gantt e RACI).
- Apenas as tarefas em que o usuário logado está formalmente atribuído como executor (ou responsável principal) são contabilizadas em seus KPIs individuais de produtividade.
- O cálculo da Taxa de Pontualidade considera a relação entre tarefas concluídas até a data limite versus o total de tarefas concluídas. Tarefas canceladas são excluídas da base de cálculo de pontualidade para não penalizar indevidamente o usuário.
