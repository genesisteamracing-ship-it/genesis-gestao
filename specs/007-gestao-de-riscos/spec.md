# Feature Specification: Módulo de Gestão de Riscos e Oportunidades

**Feature Branch**: `007-gestao-de-riscos`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "agora preciso adicionar um modulo para gestão de risco. incluindo registro detalhado de riscos, análise de riscos e priorização. Estratégias proativas de risco implementadas com planos de contingência. Revisões e atualizações regulares de riscos ao longo do ciclo de vida do projeto. Evidências de gestão de oportunidades juntamente com a gestão de riscos. Ou seja podemos cadastrar o risco. podemos adicionar mais risco ao longo do tempo. Colocamos se a chance de acontecer é Quase certo, Provável, Possível, Improvável, Rara, None. E se ele acontecer a consequencia é Desprezível, Pequena, Moderada, Grande, Catastrófica, None. quero um grafico de pizza com % de risco por chance e outro por consequencia. Uma tabela com todos os risco e com uma coluna mostrando o setor, probabilidade de ocorrrer, consequencia de ocorrencia, risco, observações. também quero um grafico tipo um plano carteziando para separar os riscos em bolinhas"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar e priorizar riscos e oportunidades com planos proativos e de contingência (Priority: P1)

Como integrante autorizado da equipe, quero cadastrar riscos e oportunidades com setor responsável, probabilidade, consequência, estratégia proativa, plano de contingência, observações e evidências para manter um registro estruturado e priorizado desde o início e ao longo de todo o projeto.

**Why this priority**: O cadastro detalhado e a classificação de probabilidade e consequência são a base de dados que alimenta a priorização, a tabela e todos os gráficos do módulo.

**Independent Test**: Cadastrar um risco e uma oportunidade com diferentes níveis de probabilidade e consequência, preencher estratégia proativa, plano de contingência e evidência, e verificar se ambos aparecem na listagem com a prioridade calculada corretamente.

**Acceptance Scenarios**:

1. **Given** uma equipe ativa e um usuário com permissão de edição no módulo, **When** ele cadastra um novo registro informando tipo (Risco ou Oportunidade), título, setor, probabilidade (`Quase certo`, `Provável`, `Possível`, `Improvável`, `Rara` ou `None`), consequência (`Desprezível`, `Pequena`, `Moderada`, `Grande`, `Catastrófica` ou `None`), estratégia proativa, plano de contingência e observações, **Then** o registro é salvo na equipe e temporada ativas com seu nível de prioridade calculado automaticamente.
2. **Given** um usuário autorizado acessando o módulo em momentos diferentes do projeto, **When** ele adiciona novos riscos ou oportunidades ao longo do tempo, **Then** os novos itens são incorporados ao registro existente sem sobrescrever ou perder os registros anteriores.
3. **Given** um registro classificado como Oportunidade, **When** o usuário anexa ou descreve evidências de gestão da oportunidade junto ao plano de ação, **Then** a oportunidade e suas evidências ficam registradas e consultáveis no mesmo módulo de gestão de riscos.
4. **Given** um usuário com perfil somente leitura (ex.: Auditor) ou sem acesso ao módulo, **When** ele tenta criar, editar ou excluir um risco/oportunidade, **Then** o sistema bloqueia a ação de escrita (mantendo apenas visualização para auditores autorizados e negando acesso para usuários sem permissão).

---

### User Story 2 - Analisar riscos em tabela detalhada, gráficos de pizza e plano cartesiano (Priority: P2)

Como integrante ou avaliador da equipe, quero visualizar os riscos cadastrados em uma tabela estruturada, dois gráficos de pizza (distribuição percentual por chance e por consequência) e um gráfico em plano cartesiano com bolinhas para identificar rapidamente gargalos por setor e priorizar os itens mais críticos.

**Why this priority**: As visualizações analíticas e a tabela consolidada transformam os registros individuais em visão gerencial acionável para tomada de decisão e escrutínio.

**Independent Test**: Com pelo menos 6 riscos cadastrados em diferentes setores, chances e consequências, abrir o painel do módulo e validar os percentuais dos dois gráficos de pizza, as colunas da tabela e a posição das bolinhas no plano cartesiano.

**Acceptance Scenarios**:

1. **Given** riscos e oportunidades cadastrados na equipe, **When** o usuário acessa a visão principal do módulo, **Then** o sistema exibe dois gráficos de pizza: um mostrando a porcentagem (`%`) de registros por **Chance (Probabilidade)** e outro mostrando a porcentagem (`%`) de registros por **Consequência**.
2. **Given** riscos com diferentes combinações de probabilidade e consequência, **When** o usuário visualiza o gráfico em **plano cartesiano**, **Then** cada risco é representado como uma bolinha posicionada de acordo com sua probabilidade em um eixo e sua consequência no outro eixo, permitindo distinguir visualmente os itens de maior criticidade e consultar seus detalhes ao interagir com a bolinha.
3. **Given** registros cadastrados, **When** o usuário consulta a **tabela de riscos**, **Then** a tabela exibe obrigatoriamente as colunas **Setor**, **Probabilidade de ocorrer**, **Consequência de ocorrência**, **Risco** e **Observações**, com filtros por setor, tipo, probabilidade e consequência, além de paginação padronizada.

---

### User Story 3 - Realizar revisões e atualizações regulares ao longo do ciclo de vida (Priority: P3)

Como integrante autorizado, quero registrar revisões periódicas nos riscos e oportunidades existentes, atualizando probabilidade, consequência, status, planos e evidências, para comprovar o acompanhamento contínuo e a eficácia das estratégias proativas ao longo do projeto.

**Why this priority**: A gestão de riscos eficaz exige acompanhamento evolutivo; registrar revisões demonstra maturidade de processo e reduz a exposição ao risco ao longo das fases do projeto.

**Independent Test**: Selecionar um risco existente, registrar uma nova revisão reduzindo sua probabilidade de `Provável` para `Improvável` após execução da estratégia proativa e adicionando uma evidência, e verificar que o histórico de revisões preserva o estado anterior e atualiza os gráficos e a tabela.

**Acceptance Scenarios**:

1. **Given** um risco existente no sistema, **When** um editor registra uma nova revisão informando nova probabilidade, nova consequência, status atualizado, notas da revisão e evidências, **Then** os valores atuais do risco são atualizados na tabela e nos gráficos, e um registro histórico da revisão é preservado com data e autor.
2. **Given** um risco que passou por múltiplas revisões ao longo do projeto, **When** um usuário abre os detalhes do risco, **Then** ele consegue visualizar a linha do tempo de revisões com o histórico de alterações de chance, consequência, status e evidências registradas.

---

### Edge Cases

- **Probabilidade ou Consequência definida como `None`**: Registros onde a chance ou a consequência estiver como `None` (não avaliada) DEVEM continuar visíveis na tabela (exibindo indicação clara de não definido/pendente de avaliação), entrar no cálculo percentual dos gráficos de pizza na categoria `None` e ser tratados de forma clara no plano cartesiano (ex.: posicionados em faixa/origem `None` ou sinalizados como pendentes de classificação na matriz sem gerar erro de cálculo).
- **Sobreposição de bolinhas no plano cartesiano**: Quando múltiplos riscos compartilham exatamente a mesma combinação de probabilidade e consequência, o gráfico cartesiano DEVE permitir identificar que há múltiplos itens naquela coordenada (ex.: agrupamento com contador, leve deslocamento/jitter ou lista interativa ao selecionar o ponto).
- **Estado vazio (Zero registros)**: Quando não houver riscos cadastrados na equipe/temporada ou quando um filtro não retornar resultados, a tabela e os gráficos DEVEM exibir estados vazios claros e informativos, oferecendo atalho de criação para usuários com permissão de edição.
- **Telas estreitas (Mobile)**: A tabela e os gráficos DEVEM se adaptar a telas móveis sem quebra de layout ou perda de leitura das colunas essenciais e das legendas dos gráficos.
- **Exclusão de risco com histórico**: Ao excluir um registro (disponível apenas para editores), o sistema DEVE solicitar confirmação antes de remover o item e atualizar imediatamente os totais dos gráficos e a tabela.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O módulo DEVE permitir cadastrar, consultar, editar e excluir registros de **Risco** e de **Oportunidade**, vinculados à equipe e temporada ativas.
- **FR-002**: Cada registro DEVE conter obrigatoriamente: tipo (`Risco` ou `Oportunidade`), título/identificação do risco, setor responsável (dentre os setores da equipe), probabilidade de ocorrer e consequência de ocorrência; e opcionalmente: descrição detalhada, responsável, estratégia proativa, plano de contingência, status do ciclo de vida, observações e evidências.
- **FR-003**: O campo **Probabilidade (Chance de acontecer)** DEVE aceitar exatamente as opções: `Quase certo`, `Provável`, `Possível`, `Improvável`, `Rara` e `None`.
- **FR-004**: O campo **Consequência (Impacto se acontecer)** DEVE aceitar exatamente as opções: `Desprezível`, `Pequena`, `Moderada`, `Grande`, `Catastrófica` e `None`.
- **FR-005**: O sistema DEVE calcular automaticamente o nível de priorização (ex.: Crítico, Alto, Médio, Baixo ou Não avaliado quando houver `None`) com base na combinação entre Probabilidade e Consequência, permitindo ordenar e priorizar os registros.
- **FR-006**: O módulo DEVE permitir adicionar novos riscos e oportunidades continuamente ao longo do tempo e registrar **revisões periódicas** em qualquer item existente, mantendo um histórico cronológico com data, autor, valores anteriores/novos de probabilidade e consequência, status, notas e evidências.
- **FR-007**: O módulo DEVE permitir o registro de **estratégias proativas**, **planos de contingência** e **evidências** tanto para riscos quanto para oportunidades.
- **FR-008**: O módulo DEVE exibir **dois gráficos de pizza** interativos com os percentuais (`%`) calculados dinamicamente sobre os registros filtrados/ativos:
  - Gráfico de distribuição percentual por **Chance (Probabilidade)**.
  - Gráfico de distribuição percentual por **Consequência**.
- **FR-009**: O módulo DEVE exibir um **gráfico em plano cartesiano** que separe e posicione os riscos/oportunidades em formato de **bolinhas**, cruzando **Probabilidade** em um eixo e **Consequência** no outro, com identificação visual de zonas de criticidade e inspeção de detalhes ao passar o cursor ou clicar na bolinha.
- **FR-010**: O módulo DEVE exibir uma **tabela de todos os riscos e oportunidades** contendo obrigatoriamente as colunas: **Setor**, **Probabilidade de ocorrer**, **Consequência de ocorrência**, **Risco** e **Observações**, além de menu de ações por linha e paginação padronizada (10 itens por página).
- **FR-011**: O usuário DEVE poder filtrar os dados (tabela e gráficos) por setor, tipo (Risco/Oportunidade), probabilidade, consequência, status e busca textual.
- **FR-012**: O módulo DEVE respeitar as permissões de acesso por equipe e perfil (RBAC), garantindo isolamento multitenant por equipe e modo somente leitura para auditores.

### Key Entities *(include if feature involves data)*

- **Registro de Risco / Oportunidade (`RiskItem`)**: Representa uma ameaça (Risco) ou benefício potencial (Oportunidade) da equipe na temporada, contendo tipo, título, descrição, setor, probabilidade, consequência, nível de prioridade calculado, estratégia proativa, plano de contingência, status, responsável, observações, evidências e timestamps.
- **Revisão de Risco (`RiskReview`)**: Representa um evento de revisão periódica vinculado a um `RiskItem`, armazenando data da revisão, autor, probabilidade e consequência registradas na revisão, status, parecer/notas e evidências atualizadas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um integrante autorizado consegue cadastrar um novo risco ou oportunidade completo (com setor, chance, consequência, estratégia proativa, plano de contingência e observações) em menos de 2 minutos.
- **SC-002**: 100% dos riscos cadastrados são refletidos imediatamente (sem recarregamento manual da página) nos dois gráficos de pizza (somas percentuais totalizando 100%), no gráfico em plano cartesiano e na tabela.
- **SC-003**: Usuários conseguem identificar o setor, a probabilidade, a consequência, a descrição do risco e as observações de qualquer item diretamente na tabela principal, bem como localizar os riscos de maior criticidade no plano cartesiano em menos de 15 segundos.
- **SC-004**: O histórico de revisões preserva integralmente todas as atualizações realizadas ao longo do ciclo de vida do projeto, permitindo auditar a evolução de qualquer risco ou oportunidade e suas evidências.
- **SC-005**: Todas as visualizações (gráficos de pizza, plano cartesiano e tabela) operam de forma responsiva em desktop e dispositivos móveis (a partir de 375 px de largura) e respeitam o isolamento de dados por equipe e permissões de leitura/escrita.

## Assumptions

- Os **setores** utilizados para classificar os riscos seguem a lista de setores/disciplinas já cadastrados na equipe no Genesis Gestão (mesma referência utilizada nos módulos de Tarefas e WBS).
- A priorização na matriz 5×5 atribui pesos crescentes de 1 a 5 para Probabilidade (`Rara` = 1 até `Quase certo` = 5) e de 1 a 5 para Consequência (`Desprezível` = 1 até `Catastrófica` = 5); quando qualquer um dos dois campos for `None`, o item é classificado como "Não avaliado" para fins de pontuação.
- O termo "Risco" nos gráficos e tabela abrange tanto ameaças quanto oportunidades registradas no módulo, com distinção visual clara entre Risco e Oportunidade e possibilidade de filtrar por tipo.
- As evidências podem ser registradas como descrições textuais estruturadas e/ou links de comprovação (URLs de documentos/registros), mantendo consistência com o fluxo de evidências do sistema.
