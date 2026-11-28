# Feature Specification: Tradução Bilíngue da Plataforma e Exportação de PDFs (Português / Inglês)

**Feature Branch**: `feat/i18n-pdfs-traducao-gemini`

**Created**: 2026-11-28

**Status**: Implemented (Documented Retroactively)

**Input**: User description: "O sistema deve possuir um botão com a bandeira do Brasil e outro com a bandeira dos Estados Unidos para alternar toda a interface entre português e inglês. Quando o idioma inglês estiver selecionado, todos os relatórios PDF exportados também devem ser traduzidos para inglês, incluindo conteúdos dinâmicos cadastrados pela equipe por meio de serviço externo gratuito de tradução."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Alternância Rápida de Idioma da Interface (Priority: P1)

Como integrante ou gestor de uma equipe STEM Racing, quero visualizar dois botões claros com a bandeira do Brasil e a bandeira dos Estados Unidos no cabeçalho da plataforma, no menu mobile e na tela de login para alternar toda a interface entre português e inglês com um único clique.

**Why this priority**: É o ponto de entrada principal da funcionalidade bilíngue e entrega valor imediato para apresentações internacionais, bancas avaliadoras e compartilhamento de telas em inglês.

**Independent Test**: Pode ser validado isoladamente clicando no botão da bandeira dos Estados Unidos em qualquer tela da plataforma (incluindo login e versão mobile), confirmando que menus, títulos, subtítulos, indicadores, colunas de tabelas, botões, filtros e rodapés de paginação mudam imediatamente para inglês, e clicando na bandeira do Brasil para restaurar tudo integralmente para português.

**Acceptance Scenarios**:

1. **Given** o usuário está na tela de login ou em qualquer módulo autenticado no idioma padrão (Português), **When** clica no botão com a bandeira dos Estados Unidos, **Then** o botão dos Estados Unidos passa a ser indicado como ativo e os rótulos, menus, títulos, subtítulos, placeholders e controles da tela são exibidos em inglês.
2. **Given** o usuário está utilizando a plataforma em inglês, **When** recarrega a página ou navega para outro módulo, **Then** a preferência de idioma inglês permanece ativa sem exigir nova seleção.
3. **Given** o usuário está utilizando a plataforma em inglês, **When** clica no botão com a bandeira do Brasil, **Then** toda a interface retorna integralmente aos textos originais em português sem perda de dados digitados em formulários.
4. **Given** o usuário acessa a plataforma em um dispositivo móvel, **When** visualiza o cabeçalho superior ou abre o menu lateral mobile, **Then** os botões das bandeiras do Brasil e dos Estados Unidos permanecem acessíveis, legíveis e sem quebra de layout.

---

### User Story 2 - Exportação de Relatórios PDF em Inglês com Estrutura Completa (Priority: P2)

Como gestor ou apresentador de portfólio internacional, quero que todos os relatórios PDF exportados pela plataforma (Extrato Financeiro, Planejamento Orçamentário, WBS, Cronograma Gantt, Matriz de Riscos, Matriz de Stakeholders, Matriz de Comunicação e Presença nos Treinos) reflitam automaticamente o idioma selecionado no sistema, gerando cabeçalhos, colunas, legendas, badges, datas, rodapés e nomes de arquivos em inglês quando o inglês estiver ativo.

**Why this priority**: Portfólios e relatórios de escrutínio internacional exigem documentos profissionais padronizados em inglês, sem necessidade de retrabalho manual após a exportação.

**Independent Test**: Pode ser testado selecionando o idioma inglês e acionando a exportação em cada um dos 8 módulos de relatório PDF, verificando que todos os rótulos estruturais e o nome do arquivo baixado estão em inglês, e alternando para português para confirmar que o comportamento padrão em português permanece inalterado.

**Acceptance Scenarios**:

1. **Given** o idioma inglês está selecionado na plataforma, **When** o usuário exporta qualquer um dos 8 relatórios PDF disponíveis no sistema, **Then** o documento gerado apresenta títulos, colunas, legendas, indicadores, status, períodos, rodapés e nome do arquivo em inglês.
2. **Given** o idioma português está selecionado na plataforma, **When** o usuário exporta qualquer relatório PDF, **Then** o documento é gerado integralmente em português com a nomenclatura e estrutura padrão, sem qualquer atraso adicional.

---

### User Story 3 - Tradução Automática de Conteúdo Dinâmico nos PDFs (Priority: P3)

Como membro da equipe que cadastra constantemente novas tarefas, entregáveis, lançamentos financeiros, riscos, planos de mitigação e estratégias de comunicação em português, quero que esses conteúdos dinâmicos sejam traduzidos automaticamente para inglês no momento da exportação do PDF, preservando nomes próprios, empresas, códigos e valores monetários.

**Why this priority**: Os relatórios PDF mudam a cada atualização da equipe; traduzir automaticamente os textos dinâmicos elimina a necessidade de manter cadastros duplicados em dois idiomas.

**Independent Test**: Pode ser testado cadastrando registros com descrições livres em português (por exemplo, nova tarefa no Gantt, novo risco com plano proativo ou novo lançamento no livro caixa), selecionando inglês e exportando o PDF, confirmando que o texto dinâmico aparece traduzido no documento final enquanto nomes de pessoas, equipe, empresas, e-mails, códigos e valores em reais permanecem intactos.

**Acceptance Scenarios**:

1. **Given** o idioma inglês está ativo e existem registros cadastrados em português (tarefas, entregáveis, lançamentos, recursos, riscos ou abordagens de comunicação), **When** o usuário solicita a exportação do PDF, **Then** os conteúdos dinâmicos são traduzidos para inglês antes da diagramação do documento para garantir quebras de linha e espaçamentos adequados.
2. **Given** os registros contêm nomes de integrantes, nome da equipe, nomes de patrocinadores, e-mails, links, códigos de documentos ou valores monetários em reais, **When** o conteúdo dinâmico é traduzido para o PDF em inglês, **Then** esses identificadores próprios e valores monetários são preservados sem distorção.
3. **Given** o usuário exporta novamente um PDF cujos textos dinâmicos já foram traduzidos recentemente, **When** solicita a nova exportação, **Then** as traduções já obtidas são reaproveitadas para acelerar a geração e reduzir chamadas repetidas ao serviço externo.

---

### Edge Cases

- **Indisponibilidade ou ausência de configuração do serviço externo de tradução**: O sistema não deve impedir o download do PDF em inglês; o documento deve ser gerado normalmente com toda a estrutura fixa em inglês e os textos originais preservados nos trechos que não puderam ser traduzidos.
- **Conteúdo dinâmico muito extenso ou com grande volume de linhas**: A tradução deve agrupar textos repetidos e processar grandes volumes em blocos para evitar falhas por limite de tamanho ou tempo de resposta.
- **Caracteres especiais e pontuação na tradução**: Símbolos tipográficos não suportados pela fonte padrão dos relatórios PDF (como setas unicode e aspas curvas) devem ser normalizados antes da renderização para evitar caracteres corrompidos no documento final.
- **Campos editáveis pelo usuário na interface**: Ao alternar o idioma da interface para inglês, textos digitados pelo usuário dentro de campos de formulário ativos não devem ser sobrescritos nem perdidos.
- **Acesso não autenticado ao serviço de tradução**: Solicitações ao serviço de tradução devem ser permitidas apenas para usuários autenticados na plataforma.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST disponibilizar dois botões dedicados e acessíveis — um com a bandeira do Brasil (`Português`) e outro com a bandeira dos Estados Unidos (`Inglês`) — visíveis no cabeçalho global, no menu de navegação mobile e na tela de login.
- **FR-002**: O sistema MUST indicar visualmente e de forma acessível qual idioma está ativo no momento.
- **FR-003**: O sistema MUST iniciar em Português (`pt-BR`) por padrão para novos acessos e persistir a escolha do usuário entre navegações e recarregamentos de página.
- **FR-004**: Ao selecionar Inglês (`en-US`), o sistema MUST traduzir menus de navegação, títulos e subtítulos de páginas, cabeçalhos de tabelas, botões, filtros, placeholders, mensagens de estado vazio, indicadores e controles de paginação sem alterar textos digitados em campos de entrada nem nomes próprios.
- **FR-005**: Ao retornar para Português (`pt-BR`), o sistema MUST restaurar integralmente todos os rótulos, textos e atributos da interface para seus textos originais em português.
- **FR-006**: Todos os 8 módulos de exportação de PDF (Extrato Financeiro, Planejamento Orçamentário, WBS, Cronograma Gantt, Matriz de Riscos, Matriz de Stakeholders, Matriz de Comunicação e Presença nos Treinos individual e geral) MUST respeitar automaticamente o idioma ativo no momento da exportação.
- **FR-007**: Quando o idioma inglês estiver selecionado, o sistema MUST traduzir localmente todos os elementos estruturais dos PDFs (títulos, cabeçalhos, colunas, KPIs, legendas, badges, meses, dias da semana, rodapés e nomes de arquivo).
- **FR-008**: Quando o idioma inglês estiver selecionado, o sistema MUST traduzir automaticamente os textos dinâmicos cadastrados pelos usuários antes do cálculo de layout e geração do PDF, utilizando serviço externo gratuito de tradução acessível apenas para sessões autenticadas.
- **FR-009**: O processo de tradução de conteúdos dinâmicos MUST preservar inalterados nomes de pessoas, nome da equipe, nomes de empresas/organizações, e-mails, URLs, códigos de referência (como NF-e e WBS), siglas técnicas do domínio STEM Racing e valores monetários em reais (`R$`).
- **FR-010**: O sistema MUST deduplicar textos repetidos e reutilizar traduções já realizadas em cache para evitar chamadas redundantes e melhorar o tempo de geração de PDFs.
- **FR-011**: O sistema MUST sanitizar caracteres especiais incompatíveis com a codificação padrão dos documentos PDF antes de renderizar os textos traduzidos.
- **FR-012**: Em caso de ausência de credencial configurada, falha de rede ou indisponibilidade do serviço externo de tradução, o sistema MUST realizar fallback seguro gerando o PDF com estrutura em inglês e mantendo os textos dinâmicos originais sem interromper o fluxo do usuário.

### Key Entities *(include if feature involves data)*

- **Preferência de Idioma**: Escolha persistida do usuário indicando o idioma ativo da sessão (`pt-BR` ou `en-US`), aplicada simultaneamente à interface e às exportações de documentos.
- **Solicitação de Tradução de Conteúdo**: Lote de textos dinâmicos de um relatório acompanhado do idioma de origem, idioma de destino e contexto temático do documento.
- **Entrada de Cache de Tradução**: Associação entre um texto original em um par de idiomas e sua tradução sanitizada, reutilizada para acelerar exportações subsequentes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Usuários conseguem alternar o idioma da plataforma entre português e inglês com 1 clique e observar a atualização visual da interface em menos de 1 segundo.
- **SC-002**: 100% dos 8 módulos de exportação PDF (9 relatórios no total) geram cabeçalhos, colunas, legendas, status, rodapés e nomes de arquivo em inglês quando o idioma inglês está ativo.
- **SC-003**: 100% das exportações em português continuam sendo geradas sem qualquer chamada a serviço externo de tradução e sem alteração nos documentos existentes.
- **SC-004**: 100% dos identificadores protegidos (nomes próprios, e-mails, URLs, valores em `R$` e códigos técnicos) permanecem íntegros nos PDFs traduzidos.
- **SC-005**: Em caso de indisponibilidade do serviço externo de tradução, 100% das tentativas de exportação em inglês ainda concluem o download do PDF com a estrutura traduzida, sem falhas ou bloqueio do usuário.
- **SC-006**: Exportações consecutivas de um mesmo relatório reaproveitam o cache de traduções já obtidas, reduzindo chamadas externas repetidas a zero para textos inalterados.

## Assumptions

- O idioma principal de cadastro dos dados pelas equipes continua sendo Português do Brasil (`pt-BR`), sendo o Inglês (`en-US`) voltado à visualização bilíngue da interface e à geração de relatórios PDF para portfólio e bancas internacionais.
- Valores financeiros continuam expressos na moeda original de registro (`R$`), sem conversão cambial automática, preservando a auditabilidade contábil.
- A tradução automática de textos dinâmicos nos PDFs depende da configuração prévia da credencial gratuita do serviço externo no ambiente de execução; sem ela, o sistema opera normalmente em modo de fallback (estrutura em inglês + textos dinâmicos originais).
- Os arquivos CSV continuam seguindo o formato padrão existente; o escopo desta especificação cobre a interface web e todos os relatórios em formato PDF.
