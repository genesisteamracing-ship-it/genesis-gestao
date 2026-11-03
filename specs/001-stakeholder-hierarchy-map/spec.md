# Feature Specification: Mapa Organizacional e Hierárquico de Stakeholders na Comunicação

**Feature Branch**: `001-stakeholder-hierarchy-map`

**Created**: 2026-11-03

**Status**: Ready for Planning

**Input**: User description: "Eu quero alterar a pagina de comunicação para esse padrão ao invés do atual. Vamos cadastrar um stakeholder e ele vai aparecer nesse gráfico ao invés de como a página está atualmente. Um parceiro pode ter mais de um stakeholder e eles devem ser organizado de maneira hiearquica de acordo com seu nível de interesse e poder sobre o projeto. exemplo: utilize o agent frontend engineer para ajudar na construção dessa tela interativa. SESI | Diretoria | técnicos | Professores;"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualização do Mapa Hierárquico de Parceiros e Stakeholders (Priority: P1)

Como integrante ou gestor da equipe, quero acessar a página de Comunicação e visualizar um gráfico organizacional interativo em árvore (estilo Mapa de Organizações) em vez da grade estática atual, onde a equipe/projeto se conecta aos seus Parceiros/Organizações (ex: SESI, SENAI, Patrocinadores) e, abaixo de cada parceiro, seus respectivos stakeholders são encadeados verticalmente em níveis hierárquicos de acordo com seu Poder e Interesse no projeto (ex: `SESI` → `Diretoria` → `Técnicos` → `Professores`).

**Why this priority**: Substitui a experiência principal da página de Comunicação pelo novo padrão visual solicitado pelo usuário, permitindo compreender instantaneamente a cadeia de decisão e influência dentro de cada organização parceira.

**Independent Test**: Pode ser testado acessando a página de Comunicação com dados de parceiros e múltiplos stakeholders cadastrados e verificando a renderização da árvore conectada por linhas ortogonais, agrupada por organização parceira e ordenada do maior para o menor nível de poder/interesse.

**Acceptance Scenarios**:

1. **Given** que a equipe possui um parceiro "SESI" com três stakeholders cadastrados em diferentes níveis de poder e interesse ("Diretoria" com Alto Poder/Alto Interesse, "Técnicos" com Baixo Poder/Alto Interesse e "Professores" com Baixo Poder/Baixo Interesse), **When** o usuário abre a página de Comunicação, **Then** o sistema exibe o gráfico hierárquico com o nó da organização "SESI" no topo do ramo e a cadeia vertical conectada `SESI` → `Diretoria` → `Técnicos` → `Professores`.
2. **Given** que a equipe possui múltiplos parceiros (ex: "SESI", "SENAI", "Bosch"), **When** o usuário visualiza o mapa no modo "Todas as Organizações", **Then** cada parceiro aparece como uma ramificação própria a partir do nó raiz da equipe, exibindo contadores resumidos no cabeçalho (total de organizações/parceiros, total de stakeholders, planos ativos e interações registradas).
3. **Given** um mapa com múltiplos níveis e ramificações, **When** o usuário utiliza os controles de navegação do canvas (busca por nome/cargo, filtro por organização, zoom, ajuste à tela e minimapa de localização), **Then** o gráfico destaca ou centraliza os nós correspondentes sem perda de legibilidade em qualquer resolução de tela.

---

### User Story 2 - Cadastro de Stakeholder Diretamente Integrado ao Gráfico Hierárquico (Priority: P1)

Como integrante responsável pela comunicação, quero cadastrar um novo stakeholder vinculado a um Parceiro/Organização (existente ou novo) informando seu cargo/papel, nível de Poder e nível de Interesse (ou vínculo superior opcional), para que ele seja posicionado automaticamente na posição hierárquica correta dentro da árvore daquele parceiro assim que salvo.

**Why this priority**: É o fluxo central de entrada de dados descrito pelo usuário ("Vamos cadastrar um stakeholder e ele vai aparecer nesse gráfico ao invés de como a página está atualmente").

**Independent Test**: Pode ser testado abrindo o formulário de "Novo Stakeholder" na página do mapa, preenchendo um stakeholder vinculado ao parceiro "SESI" com nível de Poder e Interesse definidos, salvando o registro e validando sua inserção imediata no nível correspondente da árvore do "SESI".

**Acceptance Scenarios**:

1. **Given** que o usuário está na tela do Mapa Organizacional de Comunicação, **When** clica em "Novo Stakeholder" (no cabeçalho ou diretamente em um botão de adição rápida em um nó de Parceiro/Stakeholder) e preenche Nome, Organização/Parceiro, Grupo, Poder e Interesse, **Then** o novo stakeholder passa a aparecer imediatamente no gráfico sob o parceiro selecionado e no degrau hierárquico correspondente ao seu Poder e Interesse.
2. **Given** um parceiro que já possui stakeholders em níveis superiores (ex: "Diretoria" no nível de Alto Poder e Alto Interesse), **When** o usuário cadastra um novo stakeholder no mesmo parceiro com nível de Poder/Interesse inferior (ex: "Técnicos"), **Then** o sistema posiciona o novo nó abaixo de "Diretoria", mantendo a linha de conexão hierárquica vertical.
3. **Given** dois stakeholders do mesmo parceiro que possuam exatamente o mesmo nível de Poder e Interesse, **When** o usuário opta por organizá-los na árvore, **Then** o sistema permite exibi-los lado a lado como pares do mesmo nível ou definir quem responde a quem na cadeia hierárquica do parceiro.

---

### User Story 3 - Cartões de Planos/Ações de Comunicação na Base da Árvore e Inspeção Interativa (Priority: P2)

Como gestor de comunicação, quero visualizar cartões de ações/planos de comunicação em andamento conectados na base dos stakeholders da árvore (semelhante aos cartões "In Progress" do modelo de referência) e poder clicar em qualquer nó de stakeholder para abrir seus detalhes, gerar relatórios personalizados ou registrar disparos e feedbacks.

**Why this priority**: Conecta a visualização estética do mapa de organizações às tarefas operacionais do módulo de Comunicação (planos de comunicação, geração de relatórios e histórico de engajamento), evitando que o gráfico seja apenas estático.

**Independent Test**: Pode ser testado clicando em um nó de stakeholder no gráfico para abrir o painel de detalhes/ações rápidas e verificando se os planos de comunicação ativos daquele stakeholder aparecem como cartões de progresso vinculados ao seu nó.

**Acceptance Scenarios**:

1. **Given** um stakeholder no gráfico que possui planos de comunicação ativos ou ações programadas, **When** o mapa é renderizado no modo completo, **Then** os planos/ações aparecem abaixo do nó do stakeholder como cartões de status contendo título da ação, canal preferencial e indicador visual de progresso/frequência.
2. **Given** qualquer nó de stakeholder no mapa, **When** o usuário clica sobre o nó, **Then** o sistema exibe um painel contextual (gaveta/modal de inspeção) com os dados de contato, transição de engajamento (Atual vs. Desejado), histórico de comunicações e atalhos diretos para "Gerar Relatório", "Criar Plano de Comunicação" e "Registrar Disparo/Feedback".
3. **Given** o seletor de modo de visualização no topo do mapa ("Hierarquia", "Estrutura por Grupo", "Relações & Engajamento"), **When** o usuário alterna entre os modos, **Then** o mapa adapta os indicadores exibidos nos nós (focando na cadeia hierárquica de poder/interesse, na estrutura por grupo institucional ou no status de engajamento e planos de comunicação).

---

### Edge Cases

- **Parceiro com apenas 1 stakeholder cadastrado**: O sistema exibe o nó do Parceiro/Organização conectado diretamente ao único stakeholder, sem criar níveis intermediários vazios.
- **Stakeholder sem Parceiro/Organização explícita informada**: O sistema agrupa esses registros sob um nó organizacional padrão (ex: "Comunidade & Apoiadores Independentes" ou o nome do próprio Grupo de Stakeholder) para que nenhum stakeholder fique órfão fora do gráfico.
- **Múltiplos stakeholders no mesmo nível de Poder e Interesse dentro do mesmo Parceiro**: Quando não houver um superior direto manualmente especificado entre eles, o sistema pode ramificá-los horizontalmente no mesmo nível hierárquico ou encadeá-los conforme a ordem de prioridade de engajamento definida pelo usuário.
- **Visualização em telas móveis (Mobile-First)**: Como árvores organizacionais largas podem exceder a largura de smartphones, o canvas deve suportar arraste por toque (pan/scroll horizontal e vertical suave), ajuste automático de enquadramento e uma opção de visualização em árvore indentada/colapsável para leitura rápida em telas pequenas.
- **Estado Vazio (Zero Stakeholders)**: Quando a equipe ainda não tiver stakeholders cadastrados, o canvas exibe o nó raiz da Equipe com um estado vazio ilustrativo e chamada direta ("Cadastrar Primeiro Parceiro / Stakeholder") para iniciar a árvore.
- **Perfil Auditor (Somente Leitura)**: Usuários com papel de auditoria visualizam e navegam livremente pelo mapa e inspecionam detalhes dos nós, mas todos os controles de criação e edição permanecem ocultos ou desabilitados.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE substituir a visualização principal padrão da página de Comunicação por um Mapa Organizacional e Hierárquico Interativo de Parceiros e Stakeholders.
- **FR-002**: O sistema DEVE agrupar os stakeholders por Parceiro/Organização (vinculados a um patrocinador cadastrado ou ao nome da organização parceira, como `SESI`, `SENAI`, etc.), posicionando cada Parceiro como um ramo principal abaixo do nó raiz da equipe.
- **FR-003**: Dentro de cada Parceiro/Organização, o sistema DEVE organizar os stakeholders de maneira hierárquica de acordo com seu nível de Poder e Interesse sobre o projeto (seguindo a precedência: 1º Alto Poder e Alto Interesse → 2º Alto Poder e Baixo Interesse → 3º Baixo Poder e Alto Interesse → 4º Baixo Poder e Baixo Interesse) e/ou vínculo hierárquico direto (`superior imediato`) quando especificado.
- **FR-004**: O sistema DEVE permitir que um mesmo Parceiro/Organização possua múltiplos stakeholders encadeados verticalmente ou ramificados (ex: `SESI` → `Diretoria` → `Técnicos` → `Professores`), exibindo linhas conectoras claras entre os níveis.
- **FR-005**: Cada nó do gráfico DEVE apresentar identidade visual semântica distinta por nível/categoria (diferenciação cromática por nível de poder/interesse ou grupo, ícone representativo, indicador luminoso de status de engajamento, nome, cargo/função e contadores resumidos).
- **FR-006**: O sistema DEVE exibir, na base das ramificações de stakeholders, cartões de atividades/planos de comunicação ativos (contendo título do plano ou última ação, status de execução e barra de progresso/frequência), seguindo o padrão visual do mapa de referência.
- **FR-007**: Ao cadastrar um novo stakeholder pelo formulário da página, o sistema DEVE inseri-lo e exibi-lo imediatamente na posição correspondente do gráfico hierárquico sem necessidade de recarregamento manual da página.
- **FR-008**: O formulário de cadastro/edição de stakeholder DEVE permitir selecionar um Parceiro/Organização existente (ou informar um novo), definir o nível de Poder e Interesse, e opcionalmente indicar a qual stakeholder superior dentro daquele parceiro ele está subordinado.
- **FR-009**: O cabeçalho do Mapa Organizacional DEVE exibir métricas consolidadas em tempo real (quantidade de organizações/parceiros, total de stakeholders mapeados, planos de comunicação ativos e registros de comunicação), além de filtros rápidos ("Todas as Organizações" vs. filtro por Parceiro específico) e alternadores de visão ("Hierarquia", "Estrutura", "Relações/Relatórios").
- **FR-010**: O canvas interativo DEVE oferecer controles de busca textual para localizar rapidamente qualquer parceiro ou stakeholder, controles de ampliação/redução (zoom in, zoom out, centralizar/ajustar à tela) e um minimapa panorâmico no canto inferior direito em telas desktop.
- **FR-011**: O clique em qualquer nó de stakeholder no gráfico DEVE abrir um painel de detalhes e ações rápidas que permita consultar informações completas, acionar o Gerador de Relatórios (WhatsApp/E-mail), criar um Plano de Comunicação ou registrar um novo Disparo/Feedback sem perder as funcionalidades existentes do módulo.
- **FR-012**: A interface DEVE preservar o layout padrão da plataforma (barra lateral fixa em desktop, cabeçalho global e gaveta de navegação em dispositivos móveis) e contemplar os estados de Carregamento (Skeleton), Erro (com opção de nova tentativa), Estado Vazio e Sucesso.

### Key Entities *(include if feature involves data)*

- **Parceiro / Organização (Nó Organizacional)**: Representa a instituição ou empresa parceira do projeto (ex: `SESI`, `SENAI`, patrocinador corporativo ou instituição de ensino) que agrupa um ou mais stakeholders sob sua estrutura.
- **Stakeholder (Nó Hierárquico)**: Parte interessada vinculada a um Parceiro/Organização (ex: `Diretoria`, `Técnicos`, `Professores`), contendo nome, cargo/função, grupo, nível de Poder, nível de Interesse, nível de Engajamento (atual e desejado), nível/ordem hierárquica ou referência opcional ao stakeholder superior dentro da mesma organização.
- **Plano / Ação de Comunicação (Cartão de Base)**: Régua ou ação de comunicação ativa vinculada a um stakeholder, exibida como cartão de atividade em andamento na base da hierarquia do respectivo stakeholder.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos stakeholders cadastrados com organização/parceiro e níveis de poder/interesse aparecem posicionados automaticamente em sua respectiva árvore hierárquica imediatamente após o cadastro.
- **SC-002**: Um usuário consegue identificar visualmente a cadeia hierárquica completa de um parceiro com 4 ou mais níveis (ex: `SESI` → `Diretoria` → `Técnicos` → `Professores`) em menos de 5 segundos ao abrir a página de Comunicação.
- **SC-003**: O cadastro de um novo stakeholder e sua visualização na árvore hierárquica podem ser concluídos em menos de 1 minuto.
- **SC-004**: O mapa organizacional mantém navegação fluida e legibilidade sem sobreposição de cartões para equipes com até 15 parceiros e 60 stakeholders mapeados simultaneamente, tanto em desktop quanto em dispositivos móveis.

## Assumptions

- **Ordenação Hierárquica Automática + Subordinação Opcional**: Quando um parceiro possui múltiplos stakeholders em níveis distintos de Poder e Interesse (ex: Alto/Alto, Alto/Baixo, Baixo/Alto, Baixo/Baixo), o sistema encadeia automaticamente os níveis do maior peso decisório (topo) para o nível operacional (base), formando a cadeia vertical exemplificada (`SESI` → `Diretoria` → `Técnicos` → `Professores`), permitindo também que o usuário vincule explicitamente um stakeholder pai dentro do mesmo parceiro quando desejar especificar subordinação direta entre múltiplos níveis.
- **Preservação das Capacidades Operacionais**: As ferramentas de Geração de Relatórios Automatizados, Planos de Comunicação e Histórico de Disparos/Feedbacks já existentes na página de Comunicação continuam acessíveis por meio dos seletores de visão do mapa e do painel de ações ao clicar em um stakeholder, garantindo que nenhuma regra de negócio existente seja perdida.
- **Engenharia de Interface Interativa**: A construção da tela interativa na fase de implementação seguirá rigorosamente os padrões do Frontend Engineer definidos no projeto (Design System semântico, componentes acessíveis, responsividade mobile-first e cobertura de testes automatizados).
