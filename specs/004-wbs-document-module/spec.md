# Feature Specification: Módulo de Documentos e Estrutura Analítica do Projeto (WBS / EAP)

**Feature Branch**: `004-wbs-document-module`

**Created**: 2026-11-06

**Status**: Draft

**Input**: User description: "Preciso construir a WBS adicone isso em um módulo novo chamado documentos. A WBS (Work Breakdown Structure, ou EAP — Estrutura Analítica do Projeto) é a decomposição hierárquica do escopo total em entregáveis menores e gerenciáveis. Ela não é uma lista de tarefas diárias (to-do list) nem um cronograma temporal (como um gráfico de Gantt). A WBS define o que precisa ser construído para o projeto existir, dividindo o produto final em subsistemas, pacotes de trabalho (work packages) e componentes até o nível mínimo controlável. Qual problema ela resolve na prática: Evita o 'escopo fantasma' (Scope Creep e omissões) seguindo a Regra dos 100% [...]. Acaba com a ambiguidade de donos e estimativas [...]. Gera a base real para o cronograma e riscos [...]. Pontuação com os juízes de Project Management [...]."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acesso ao Módulo Documentos e Visualização da WBS / EAP (Priority: P1)

Como gestor ou membro da escuderia STEM Racing, quero acessar um novo módulo dedicado chamado **Documentos** no menu lateral e visualizar a **WBS (Work Breakdown Structure / Estrutura Analítica do Projeto)** em formato de árvore hierárquica de entregáveis organizada por código EAP (ex.: 1.0, 1.2, 1.2.3), para compreender com clareza o escopo total de 100% do projeto distribuído entre as grandes áreas (Engenharia, Finanças, Marketing, Patrocínio e Gestão/Regulamento).

**Why this priority**: É a espinha dorsal da entrega solicitada, criando o novo módulo no sistema e permitindo que qualquer integrante visualize a decomposição completa do projeto de ponta a ponta sem misturar com to-dos diários ou cronogramas temporais.

**Independent Test**: Pode ser testado acessando o novo módulo "Documentos" na barra lateral de navegação, visualizando a tela principal da WBS envolvida pelo `<DashboardShell>` com título e descrição contextual, e navegando pelos nós da árvore hierárquica de entregáveis da temporada ativa.

**Acceptance Scenarios**:

1. **Given** que o usuário autenticado navega pelo menu lateral do sistema, **When** clica no novo módulo **Documentos**, **Then** a aplicação renderiza a página da WBS envolvida pelo layout shell padronizado, exibindo título principal, subtítulo explicativo e barra lateral fixa.
2. **Given** que a equipe possui uma WBS cadastrada para a temporada, **When** a página é carregada, **Then** o sistema exibe os cartões de resumo do escopo (Total de Pacotes de Trabalho, Estimativa Orçamentária Consolidada, Esforço Total Estimado em Horas e Cobertura das Áreas da Escuderia) seguidos pela visualização estruturada dos entregáveis.
3. **Given** a exibição da árvore hierárquica da WBS, **When** o usuário clica nos botões de expandir/recolher nós, **Then** os ramos da árvore alternam suavemente entre os níveis superiores (Grandes Áreas/Subsistemas) e os pacotes de trabalho detalhados (*work packages*).

---

### User Story 2 - Cadastro e Decomposição de Entregáveis Hierárquicos (Regra dos 100%) (Priority: P1)

Como líder técnico ou gestor de projeto da escuderia, quero cadastrar e decompor entregáveis na WBS definindo nível hierárquico, código EAP estruturado, descrição objetiva do que precisa ser construído, responsável técnico único, custo estimado de fabricação e esforço em horas, para que nenhum componente necessário do carro ou da equipe fique sem definição de dono e estimativa.

**Why this priority**: Garante que o escopo total do projeto seja fragmentado até o nível mínimo controlável (pacote de trabalho), eliminando ambiguidades de donos e impedindo o surgimento de "escopo fantasma" (*Scope Creep*).

**Independent Test**: Pode ser testado selecionando um subsistema existente (ex.: 1.2 Transmissão) e adicionando um novo sub-entregável filho (ex.: 1.2.3 Fixação do Eixo Traseiro) com atribuição de responsável técnico, custo de fabricação e estimativa de horas, verificando que o código EAP é atribuído adequadamente e o novo pacote passa a constar na estrutura hierárquica.

**Acceptance Scenarios**:

1. **Given** que o usuário está na tela da WBS, **When** clica na ação de adicionar entregável (ou adicionar sub-entregável a partir de um nó pai), **Then** o sistema abre um diálogo modal contendo campos para: Código EAP, Nome do Entregável, Descrição do Escopo, Área da Escuderia (Engenharia, Finanças, Marketing, Patrocínio, Regulamento/Gestão), Responsável Técnico Único, Custo Estimado de Fabricação e Horas Estimadas.
2. **Given** que o usuário preenche os dados do novo entregável respeitando a regra de que a WBS define **o que precisa ser construído** (e não tarefas rotineiras de to-do), **When** confirma a gravação, **Then** o novo entregável é posicionado na hierarquia correspondente e os totais acumulados dos nós pais são recalculados.
3. **Given** a necessidade de editar ou ajustar um entregável já cadastrado, **When** o usuário aciona o menu de engrenagem daquela linha e escolhe "Editar", **Then** os dados são carregados no formulário modal para revisão e persistência.

---

### User Story 3 - Consolidação Orçamentária e Esforço (Roll-up dos Pacotes de Trabalho) (Priority: P2)

Como responsável de finanças ou engenharia da equipe, quero que os custos estimados de fabricação e as horas de esforço dos pacotes de trabalho folha sejam agregados automaticamente (*roll-up*) para os nós pais e subsistemas de nível superior, para que eu visualize com precisão quanto custa e quanto tempo consome cada subsistema do veículo e cada área de suporte.

**Why this priority**: Permite que a equipe comprove a coerência orçamentária do projeto perante o teto de gastos e regulamento da competição, eliminando cálculos manuais propensos a erros e divergências financeiras.

**Independent Test**: Pode ser testado alterando o custo estimado de fabricação de um nó folha (ex.: de R$ 150,00 para R$ 250,00) e verificando que tanto o subsistema pai imediato quanto o nó raiz do projeto atualizam instantaneamente seus somatórios orçamentários.

**Acceptance Scenarios**:

1. **Given** um subsistema com múltiplos pacotes de trabalho associados, **When** os custos de fabricação e horas são informados nos pacotes folha, **Then** o nó pai exibe como valor total a soma exata de todos os seus elementos filhos, sem distorções de arredondamento.
2. **Given** a visualização consolidada da WBS, **When** o usuário filtra por uma área específica (ex.: "Engenharia"), **Then** os resumos orçamentários e de horas adaptam-se para refletir exclusivamente a soma daquela disciplina.

---

### User Story 4 - Modo Apresentação e Auditoria para Juízes de Project Management (Priority: P3)

Como capitão ou gestor apresentador da escuderia, quero dispor de um modo de visualização limpa de apresentação e impressão da WBS estruturada com controles rápidos de profundidade (Nível 1, Nível 2, Todos), para expor com maturidade profissional aos juízes avaliadores de Project Management como a equipe estruturou seu escopo operacional e técnico.

**Why this priority**: A pontuação em bancas de gerenciamento de projetos em competições STEM depende da capacidade da escuderia de comprovar maturidade organizacional (Engenharia, Finanças, Marketing e Patrocínio), atestando que a equipe operou de forma profissional e auditável.

**Independent Test**: Pode ser testado acionando o botão de "Modo Apresentação / Juízes" na barra de ações da WBS, selecionando a visualização recolhida em Nível 2 (Subsistemas) e alternando para expansão total (Nível 3+), verificando que a interface oculta controles de edição e oferece uma diagramação limpa pronta para projeção ou impressão de relatório.

**Acceptance Scenarios**:

1. **Given** que a equipe está em momento de avaliação perante os juízes, **When** o apresentador ativa o "Modo Apresentação", **Then** a interface oculta elementos de edição e botões de formulário, destacando a matriz hierárquica limpa com códigos EAP, nomes, áreas, responsáveis e custos.
2. **Given** o modo apresentação ativo, **When** o usuário seleciona filtros de profundidade (ex.: "Expandir até Nível 2"), **Then** a visualização ajusta instantaneamente todos os ramos da árvore para a profundidade indicada.

---

### Edge Cases

- **Exclusão de nó pai com sub-entregáveis**: Ao solicitar a exclusão de um nó pai (ex.: um subsistema que contenha pacotes de trabalho filhos), o sistema deve alertar expressamente que todos os sub-entregáveis vinculados serão removidos, exigindo confirmação explícita para evitar perda acidental de dados.
- **Renumeração e conflito de códigos EAP**: Se um novo entregável for inserido ou removido entre nós irmãos (ex.: remover o nó 1.2), o sistema deve manter a integridade dos códigos EAP existentes ou sugerir a renumeração sequencial consistente sem quebrar referências.
- **Entregável sem responsável técnico associado**: O sistema deve destacar visualmente entregáveis de nível folha que estejam sem responsável técnico cadastrado, sinalizando ao gestor o risco de ambiguidade de posse de escopo.
- **Visualização em dispositivos móveis**: Em telas pequenas de smartphones (`< 640px`), árvores hierárquicas profundas devem ser renderizadas através de cartões colapsáveis com recuo adaptativo e rolagem horizontal suave, garantindo legibilidade e áreas de toque acessíveis.
- **Valores monetários e precisão**: Todos os custos estimados devem ser manipulados internamente em centavos inteiros (`amountCents: Int`), formatados na moeda padrão nacional (`R$`) na apresentação visual, sem imprecisões de ponto flutuante.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE criar um novo módulo acessível no menu lateral com o nome **Documentos**, roteado para a área de gestão documental da temporada ativa.
- **FR-002**: A tela principal do módulo Documentos DEVE conter uma seção dedicada à **WBS (Work Breakdown Structure / EAP — Estrutura Analítica do Projeto)**, envolvida obrigatoriamente pelo componente `<DashboardShell>` contendo título principal (`Documentos`) e subtítulo contextual (`Estrutura Analítica do Projeto e Decomposição de Escopo da Temporada`).
- **FR-003**: A visualização da WBS DEVE permitir a decomposição hierárquica do escopo em múltiplos níveis estruturados:
  - **Nível 1**: Projeto / Escopo Geral da Temporada (ex.: Carro e Operação STEM Racing).
  - **Nível 2**: Grandes Áreas / Subsistemas (ex.: Engenharia, Finanças, Marketing, Patrocínio, Regulamento & Gestão).
  - **Nível 3+**: Pacotes de Trabalho (*Work Packages*) e Componentes Específicos (ex.: 1.2.3 Fixação do Eixo Traseiro, 2.1.1 Portfólio de Engenharia).
- **FR-004**: O sistema DEVE garantir que a WBS seja estritamente orientada a entregáveis físicos e conceituais do escopo ("o que precisa ser construído para o projeto existir"), impedindo conceitualmente que seja reduzida a listas de to-do diárias ou agendas cronológicas de Gantt.
- **FR-005**: Cada pacote de trabalho (*Work Package*) na WBS DEVE conter obrigatoriamente os seguintes campos:
  1. **Código EAP** (ex.: `1.2.3`)
  2. **Nome do Entregável**
  3. **Descrição do Escopo** (detalhamento do que está incluso no entregável)
  4. **Área da Escuderia** (`Engenharia`, `Finanças`, `Marketing`, `Patrocínio`, `Regulamento / Gestão`)
  5. **Responsável Técnico Único** (vinculado aos integrantes da equipe)
  6. **Custo Estimado de Fabricação** (armazenado em centavos)
  7. **Esforço Estimado em Horas**
  8. **Status do Entregável** (`Planejado`, `Em Desenvolvimento`, `Concluído`, `Auditado`)
- **FR-006**: O sistema DEVE calcular automaticamente por agregação (*roll-up*) o custo total estimado e o total de horas de cada nó pai com base na soma direta de seus nós filhos imediatos, refletindo a **Regra dos 100%**.
- **FR-007**: A interface da WBS DEVE disponibilizar controles de expansão e colapso de nós, permitindo ao usuário alternar rapidamente entre visão recolhida e detalhada.
- **FR-008**: O sistema DEVE disponibilizar busca textual por nome de entregável/código EAP e filtros rápidos por Área da Escuderia e Responsável Técnico.
- **FR-009**: Todas as ações por linha de entregável (Adicionar Sub-entregável, Editar, Excluir) DEVEM ser encapsuladas em um único botão de engrenagem (`Settings`) acionando um `<DropdownMenu>` com alinhamento ao final (`align="end"`), conforme padrão estabelecido no sistema.
- **FR-010**: A tela DEVE apresentar cartões de métricas consolidadas no topo com os seguintes indicadores: Total de Pacotes de Trabalho, Custo Total de Fabricação Previsto, Total de Horas Estimadas e Percentual de Cobertura das Áreas Obrigatórias.
- **FR-011**: O sistema DEVE fornecer um modo de visualização limpa de apresentação/avaliação, otimizado para exibição aos juízes de Project Management e exportação/impressão estruturada.
- **FR-012**: Todos os dados da WBS DEVEM ser isolados por equipe (`teamId`) e temporada ativa (`Season`), respeitando o controle de multitenancy da plataforma.

### Key Entities

- **Documento de Escopo da Temporada (ProjectScopeDocument)**: Representa o registro do documento de escopo da temporada para a equipe, servindo de raiz organizacional da WBS no módulo Documentos.
- **Nó da WBS / Entregável (WBSDeliverableNode)**: Representa cada item decomposto da EAP na árvore hierárquica. Possui auto-relacionamento pai-filho (`parentId`), código EAP (`1.2.3`), título, descrição, área da escuderia, responsável técnico, status, custo estimado em centavos e esforço em horas.
- **Área da Escuderia (TeamDiscipline)**: Classificação da área funcional responsável pelo entregável (Engenharia, Finanças, Marketing, Patrocínio, Regulamento & Gestão).
- **Responsável Técnico (TechnicalOwner)**: Membro da equipe designado com posse inequívoca pelo pacote de trabalho entregável.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O gestor do projeto consegue cadastrar e decompor um novo pacote de trabalho com código EAP, responsável e estimativas em menos de 20 segundos.
- **SC-002**: 100% dos custos monetários e horas calculados nos nós pais representam a soma exata dos pacotes de trabalho filhos, com zero discrepâncias ou imprecisões decimais.
- **SC-003**: 100% dos pacotes de trabalho de nível folha possuem exatamente um responsável técnico atribuído, eliminando indefinições de posse de escopo perante a equipe.
- **SC-004**: O modo apresentação da WBS permite que os jurados e avaliadores de Project Management visualizem a árvore inteira da escuderia com tempo de resposta e alternância de níveis inferior a 500ms.
- **SC-005**: 100% das páginas e diálogos do módulo Documentos / WBS operam com total conformidade aos padrões de layout shell (`DashboardShell`), design system semântico e responsividade mobile.

## Assumptions

- O módulo Documentos foi concebido para hospedar a WBS / EAP como sua primeira e principal ferramenta de governança de escopo, estando preparado para futuras adições de outros tipos de documentação da escuderia.
- A WBS não substitui o livro caixa financeiro nem o mapa de stakeholders, mas funciona como a referência central de escopo que informa orçamentos e cronogramas.
- Os responsáveis técnicos são selecionados a partir da lista de integrantes ativos já cadastrados na equipe (`TeamMember`).
- O cálculo de custos utiliza o padrão constitucional em centavos inteiros (`amountCents: Int`), com formatação amigável na interface (`R$`).
