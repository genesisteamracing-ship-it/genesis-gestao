# Feature Specification: Sinais de Status, Linha de Base e Caminho Crítico no Gantt

**Feature Branch**: `008-gantt-sinais-cronograma`

**Created**: 2026-11-27

**Status**: Ready for Planning

**Input**: User description: "Alterações na criação de tarefas e no Gantt para exibir sinais visuais de gestão de projeto conforme referência do avaliador: coluna de ID curto e Atividade, barra cinza de linha de base (planejado), barras coloridas de status de prazo (Verde: em dia / dentro do planejado; Amarelo: atenção / risco de atraso; Vermelho: atraso / fora do planejado; Concluída com selo de verificação), destaque de Caminho Crítico com losango vermelho e contorno na linha da atividade, rótulos de status junto às barras, legenda completa de status e 4 cards de indicadores executivos no topo da página do Gantt (Progresso geral com barra percentual, Atividades críticas, Desvio atual em dias e Marco final)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Comparar linha de base planejada com execução no Gantt (Priority: P1)

Como integrante ou avaliador de gestão de projeto, quero visualizar no Gantt a barra cinza da linha de base (planejado) junto à barra da execução atual de cada tarefa, identificada por um ID curto e nome da atividade, para identificar imediatamente se o projeto está aderente ao cronograma original.

**Why this priority**: A comparação visual entre planejado (linha de base) e executado/atual é o fundamento para avaliar desvios de prazo no cronograma e sustenta todos os demais sinais semafóricos.

**Independent Test**: Cadastrar uma tarefa com datas planejadas e datas de execução distintas, abrir o Gantt e verificar a exibição do ID curto, do nome da atividade, da barra cinza de linha de base e da barra sobreposta refletindo o período atual.

**Acceptance Scenarios**:

1. **Given** uma equipe ativa com tarefas cadastradas com datas planejadas, **When** o usuário abre o Gantt, **Then** cada linha exibe um identificador curto sequencial (ex.: A, B, C, D), o nome da atividade e a barra cinza representando a linha de base (planejado).
2. **Given** um editor criando uma nova tarefa, **When** ele preenche Início e Término Planejados, **Then** o sistema grava essas datas automaticamente como a Linha de Base da tarefa; ao editar ou reprogramar a tarefa (inclusive arrastando a barra no Gantt), as datas atuais/reais são atualizadas mantendo a Linha de Base preservada (com possibilidade de ajustar a Linha de Base explicitamente no formulário quando necessário).
3. **Given** uma tarefa cujas datas atuais coincidem integralmente com a linha de base, **When** o usuário consulta o Gantt, **Then** ambas as barras aparecem alinhadas sem indicar desvio de prazo.

---

### User Story 2 - Ler sinais semafóricos de prazo, conclusão e legenda no Gantt (Priority: P2)

Como integrante da equipe ou avaliador, quero que cada atividade no Gantt exiba um sinal claro de situação de prazo — Em dia (verde), Atenção (amarelo), Atrasada (vermelho) ou Concluída (verde escuro com ícone de verificação) — acompanhado de rótulo textual e de uma legenda fixa, para diagnosticar a saúde do cronograma em poucos segundos sem abrir tarefa por tarefa.

**Why this priority**: O semáforo visual com rótulos textuais e legenda transforma o cronograma em um painel de controle executivo, atendendo diretamente ao critério de leitura rápida exigido em avaliações de gestão de projeto e garantindo acessibilidade além da cor.

**Independent Test**: Criar quatro tarefas cobrindo os cenários Em dia, Atenção, Atrasada e Concluída, abrir o Gantt e conferir que cada barra exibe a cor correspondente, o rótulo textual ao lado da barra, o selo de verificação na concluída e a legenda completa com todos os sinais.

**Acceptance Scenarios**:

1. **Given** uma tarefa em andamento dentro do período da linha de base e sem risco iminente, **When** o usuário abre o Gantt, **Then** a barra de execução aparece em verde com o rótulo "Em dia".
2. **Given** uma tarefa não concluída faltando 2 dias ou menos (ou com pelo menos 80% do prazo planejado decorrido) para o término da linha de base, ou marcada manualmente pelo editor como em risco de atraso, **When** o usuário abre o Gantt, **Then** a barra aparece em amarelo com o rótulo "Atenção".
3. **Given** uma tarefa não concluída cuja data atual já ultrapassou o término planejado da linha de base, ou cuja previsão atual de término extrapola a linha de base, **When** o usuário abre o Gantt, **Then** a barra aparece em vermelho com o rótulo "Atrasada".
4. **Given** uma tarefa marcada como concluída, **When** o usuário abre o Gantt, **Then** a barra aparece em verde escuro com ícone de verificação (✓) e rótulo "Concluída".
5. **Given** qualquer visualização do Gantt com pelo menos uma tarefa, **When** o usuário observa o painel, **Then** uma legenda de status exibe claramente os significados de Verde (em dia / dentro do planejado), Amarelo (atenção / risco de atraso), Vermelho (atraso / fora do planejado), Cinza (linha de base / planejado) e Caminho crítico (losango vermelho — define o prazo final).

---

### User Story 3 - Identificar e destacar atividades do Caminho Crítico (Priority: P3)

Como gestor de projeto ou avaliador, quero que as atividades pertencentes ao caminho crítico sejam destacadas na linha inteira com contorno vermelho, marcador de losango vermelho ao final da barra e rótulo "Crítica", para reconhecer imediatamente quais entregas definem o prazo final do projeto e não toleram atraso.

**Why this priority**: O caminho crítico direciona o foco da equipe para as atividades que efetivamente determinam a data de entrega final, evitando esforço em tarefas com folga quando o prazo global está ameaçado.

**Independent Test**: Configurar um cronograma com pelo menos uma atividade crítica e uma não crítica, abrir o Gantt e confirmar que apenas a atividade crítica recebe o contorno vermelho na linha, o marcador de losango vermelho e o rótulo "Crítica".

**Acceptance Scenarios**:

1. **Given** um cronograma com dependências e datas cadastradas (ou tarefas marcadas manualmente como críticas), **When** o usuário abre o Gantt, **Then** o sistema calcula automaticamente o caminho crítico pelo método de folga zero (CPM) somado às marcações manuais opcionais, e cada atividade crítica exibe contorno vermelho na linha completa (ID, nome e barra), marcador de losango vermelho (`◇`) na extremidade final da barra e rótulo "Crítica".
2. **Given** uma atividade que pertence ao caminho crítico e também está em atenção ou atrasada, **When** o usuário consulta o Gantt, **Then** a cor da barra continua refletindo a situação de prazo (ex.: amarela ou vermelha) enquanto o contorno da linha, o losango vermelho e o rótulo "Crítica" permanecem visíveis sem conflito visual.
3. **Given** uma alteração de datas ou dependências que altera qual atividade define o prazo final, **When** o cronograma é atualizado, **Then** o destaque de caminho crítico acompanha a nova configuração sem necessidade de recriar tarefas.

---

### User Story 4 - Acompanhar indicadores executivos do cronograma nos cards do Gantt (Priority: P2)

Como gestor de projeto ou avaliador, quero visualizar 4 cards de resumo no topo da página do Gantt — **Progresso geral**, **Atividades críticas**, **Desvio atual** e **Marco final** — para obter uma leitura executiva instantânea da saúde do projeto antes mesmo de inspecionar cada barra individual.

**Why this priority**: Os indicadores agregados sintetizam o andamento percentual, a quantidade de entregas críticas, o desvio em dias frente à linha de base e a condição do marco final, permitindo tomada de decisão e apresentação direta à banca avaliadora.

**Independent Test**: Abrir a página do Gantt com um conjunto conhecido de tarefas (concluídas, em andamento, atrasadas e críticas) e validar que os 4 cards refletem com precisão o percentual de progresso geral com barra visual, a contagem de atividades críticas, o desvio atual em dias e a situação do marco final, atualizando-se ao filtrar por setor ou editar tarefas.

**Acceptance Scenarios**:

1. **Given** um cronograma com tarefas em diferentes estados de execução, **When** o usuário abre o Gantt, **Then** são exibidos os 4 cards no topo: **Progresso geral** (percentual de 0% a 100% com barra de progresso), **Atividades críticas** (quantidade numérica), **Desvio atual** (diferença em dias em relação à linha de base, ex.: `+4 dias`, `0 dias` ou `-2 dias`) e **Marco final** (situação consolidada, ex.: `No prazo`, `Sob atenção`, `Em atraso` ou `Concluído`).
2. **Given** uma tarefa editada para Concluída ou com nova data de término que altera o atraso do cronograma, **When** a alteração é salva, **Then** os 4 cards são recalculados automaticamente sem exigir recarregamento manual.
3. **Given** o usuário aplica um filtro de setor na página do Gantt, **When** a lista visível de tarefas muda, **Then** os 4 cards refletem o escopo filtrado (ou indicam estado neutro quando não há tarefas).

---

### Edge Cases

- **Tarefa concluída com atraso**: Quando uma tarefa é marcada como Concluída após a data de término da linha de base, o estado de conclusão (ícone ✓ e rótulo "Concluída") permanece identificável, enquanto a extensão da barra em relação à barra cinza evidencia visualmente o desvio ocorrido.
- **Tarefa ainda não iniciada ("A fazer")**: Se a data atual ainda for anterior ao término planejado e não houver atraso, a tarefa aparece com sua linha de base cinza e sem alarme falso de atraso; se a data de término planejado já tiver passado e a tarefa continuar em "A fazer", ela deve ser sinalizada como "Atrasada".
- **Tarefa cancelada**: Tarefas canceladas não entram no denominador do Progresso geral, não são marcadas como críticas e não geram falso atraso no Desvio atual ou no Marco final.
- **Mais de 26 atividades**: Quando o cronograma ultrapassa a letra Z, a sequência de identificadores curtos continua no formato alfabético de planilhas (`AA`, `AB`, `AC`...) sem duplicar IDs.
- **Conflito entre rótulo de status e rótulo "Crítica"**: Quando uma atividade crítica também estiver em atenção ou atrasada, a barra mantém sua cor de status e o rótulo "Crítica" + losango `◇` permanecem posicionados sem sobreposição, exibindo ambos os estados nos detalhes/tooltip.
- **Datas inválidas na criação/edição**: Data de término anterior à data de início (seja na linha de base ou nas datas atuais/reais) impede o salvamento com mensagem clara.
- **Permissões de leitura (Auditor)**: Usuários com perfil somente leitura visualizam todos os sinais, linha de base, cards, legenda e caminho crítico no Gantt, mas não podem editar datas, linha de base ou marcações de tarefas.
- **Telas estreitas (mobile)**: Em telas reduzidas, os 4 cards empilham responsivamente, a coluna fixa de ID e Atividade mantém leitura clara com scroll horizontal da linha do tempo e a legenda adapta-se sem quebra de layout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O módulo de criação e edição de tarefas DEVE registrar automaticamente as datas de início e término informadas na criação como **Linha de Base (planejado)** (`baselineStartDate` e `baselineEndDate`), preservando-as quando o editor atualiza ou reprograma as datas atuais de execução (`startDate` e `endDate`), e permitindo ajustar a linha de base explicitamente na edição quando necessário.
- **FR-002**: O Gantt DEVE exibir, na coluna esquerda da tabela, o **ID curto** sequencial da atividade (`A`, `B`, `C`, `D`... `AA`, `AB`...) e o nome da **Atividade**, mantendo compatibilidade com os filtros por setor existentes.
- **FR-003**: Para cada tarefa no Gantt, o sistema DEVE renderizar a **barra cinza de linha de base (planejado)** e a **barra de execução/andamento** pareadas na mesma linha temporal, permitindo comparação direta entre o planejado e o atual.
- **FR-004**: O sistema DEVE classificar e exibir visualmente o status de prazo de cada tarefa no Gantt por meio de cor da barra e rótulo textual:
  - **Verde ("Em dia")**: atividade não concluída dentro do prazo planejado e sem sinalização de risco;
  - **Amarelo ("Atenção")**: atividade não concluída faltando 2 dias ou menos (ou com ≥ 80% do prazo planejado decorrido) para o término da linha de base, **ou** sinalizada manualmente pelo editor como em risco de atraso;
  - **Vermelho ("Atrasada")**: atividade não concluída cujo término atual extrapola o término da linha de base ou cuja data atual já ultrapassou o término planejado;
  - **Verde escuro com ícone de verificação ✓ ("Concluída")**: atividade finalizada.
- **FR-005**: O sistema DEVE identificar e destacar no Gantt as atividades do **Caminho Crítico** combinando cálculo automático de folga zero (CPM sobre as dependências e datas do cronograma) com marcação manual opcional ("Atividade crítica") na criação/edição da tarefa, exibindo contorno vermelho na linha da atividade, marcador em forma de **losango vermelho (`◇`)** ao final da barra e rótulo **"Crítica"**.
- **FR-006**: O Gantt DEVE apresentar uma **Legenda (status)** clara e acessível listando todos os sinais visuais: Verde (em dia / dentro do planejado), Amarelo (atenção / risco de atraso), Vermelho (atraso / fora do planejado), Cinza (linha de base / planejado) e Losango vermelho (Caminho crítico — define o prazo final).
- **FR-007**: Todos os sinais visuais de status e criticidade DEVEM combinar cor com texto ou forma distinta (rótulos "Em dia", "Atenção", "Atrasada", "Concluída", "Crítica", ícone ✓ e losango ◇) para garantir leitura acessível por usuários com daltonismo e por leitores de tela.
- **FR-008**: A validação de criação e edição de tarefas DEVE impedir intervalos inválidos (término anterior ao início) tanto na linha de base quanto nas datas atuais/reais, exibindo feedback claro ao usuário.
- **FR-009**: Todas as visualizações e edições DEVEM respeitar o isolamento por equipe e as permissões vigentes de acesso ao módulo (perfil auditor em modo somente leitura).
- **FR-010**: A página do Gantt DEVE exibir 4 cards de indicadores executivos no topo da visualização:
  - **Progresso geral**: percentual consolidado de conclusão das tarefas ativas (`0%` a `100%`) acompanhado de barra de progresso visual;
  - **Atividades críticas**: contagem total de tarefas atualmente pertencentes ao caminho crítico;
  - **Desvio atual**: saldo em dias do término final atual do cronograma em relação ao término final da linha de base (ex.: `+4 dias` para atraso, `0 dias` para aderente, `-2 dias` para adiantado);
  - **Marco final**: situação consolidada da entrega final do cronograma (`No prazo`, `Sob atenção`, `Em atraso` ou `Concluído`), derivada do estado e desvio das atividades críticas e do término global.
- **FR-011**: Os 4 cards executivos DEVEM ser responsivos (grade adaptativa em telas menores) e atualizados imediatamente sempre que tarefas, datas ou filtros de setor forem alterados.

### Key Entities *(include if feature involves data)*

- **Tarefa (estendida)**: Atividade do cronograma pertencente a uma equipe e setor, contendo identificador curto de exibição no cronograma, título, datas de linha de base (início e término planejados), datas de execução/previsão atual, estado de execução (A fazer, Em andamento, Concluída, Cancelada), sinalização manual de risco de atraso e sinalização manual de atividade crítica.
- **Linha de Base (Baseline)**: Referência do intervalo originalmente planejado de uma tarefa, usada como base de comparação visual (barra cinza) e cálculo de desvio em dias.
- **Sinal de Status do Cronograma**: Classificação derivada para exibição no Gantt (`ON_TRACK`, `AT_RISK`, `DELAYED`, `COMPLETED`), acompanhada de rótulo textual e estilo semântico.
- **Resumo Executivo do Cronograma**: Agregação em tempo real contendo percentual de progresso geral, contagem de atividades críticas, desvio atual em dias e status do marco final.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste com avaliadores ou integrantes da equipe diante de um cronograma com pelo menos 8 tarefas mistas, 100% conseguem identificar em menos de 15 segundos quais atividades estão em dia, em atenção, atrasadas, concluídas e no caminho crítico, sem precisar abrir os detalhes individuais das tarefas.
- **SC-002**: 100% das tarefas exibidas no Gantt apresentam correspondência exata entre suas datas salvas (linha de base e execução atual), a posição das barras cinza e colorida e o status sinalizado.
- **SC-003**: Editores conseguem cadastrar ou atualizar uma tarefa com linha de base e dados de andamento em menos de 1 minuto, com 0% de registros salvos com intervalos de datas inválidos.
- **SC-004**: Todos os 5 elementos da legenda (Verde, Amarelo, Vermelho, Cinza e Losango de Caminho Crítico) e o estado Concluída são distinguíveis sem depender exclusivamente de cor, mantendo legibilidade em telas desktop (1280px) e mobile (375px).
- **SC-005**: Os 4 cards executivos do topo do Gantt (Progresso geral, Atividades críticas, Desvio atual e Marco final) exibem valores 100% consistentes com as tarefas visíveis no cronograma e atualizam imediatamente após qualquer criação, edição ou filtragem.

## Assumptions

- O módulo existente de Tarefas, Gantt e RACI (`006-tarefas-gantt-raci`) será evoluído de forma retrocompatível: tarefas já cadastradas antes desta atualização usarão suas `startDate`/`endDate` atuais como fallback da linha de base até que sejam editadas.
- O conceito de "Caminho de risco" existente em `006-tarefas-gantt-raci` permanece compatível com a visão do módulo, não sendo removido.
- O cronograma continua operando em dias corridos com datas inclusivas e mantendo os controles já existentes (filtro por setor, alternância de escala de dias/semanas, drag-and-drop de reordenação, resize de datas e conexão de dependências).
- As decisões padrão adotadas para linha de base (automática na criação + preservada na edição/resize), status Atenção (híbrido: ≤ 2 dias / ≥ 80% decorrido ou flag manual) e Caminho Crítico (híbrido: CPM automático + flag manual) podem ser ajustadas antes da implementação caso o avaliador solicite outro limiar.
