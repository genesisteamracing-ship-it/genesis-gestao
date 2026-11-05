# Feature Specification: Gerenciamento de Permissões de Acesso por Usuário e Módulo

**Feature Branch**: `003-module-access-permissions`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "crie uma tela para permissões e deixe eu configurar as permissões de cada usuário por cada módulo com um toggle button exemplo: acessos: Financeiro SIM (NÃO)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configuração de Permissões por Usuário e Módulo via Toggle SIM/NÃO (Priority: P1)

Como administrador do sistema, quero acessar uma tela dedicada de **Permissões** onde eu possa visualizar cada usuário cadastrado e configurar individualmente seus acessos a cada módulo do sistema (**Financeiro**, **ROI & Patrocínio**, **Comunicação** e **Equipe & Acessos**) através de controles alternadores (*toggle buttons*) com indicação clara de **SIM** e **NÃO** (exemplo: `Financeiro: SIM / NÃO`), para conceder ou revogar o acesso de qualquer integrante aos módulos de forma rápida, visual e auditável.

**Why this priority**: É a entrega central solicitada pelo usuário, permitindo o controle granular e direto de quais módulos cada membro da equipe pode acessar através de botões alternadores intuitivos (`SIM` / `NÃO`).

**Independent Test**: Pode ser testado acessando a tela de Permissões como administrador, localizando um usuário na lista/matriz de permissões, alternando o botão do módulo "Financeiro" de `SIM` para `NÃO` (e vice-versa), e verificando que o novo estado é salvo e permanece refletido ao recarregar a página.

**Acceptance Scenarios**:

1. **Given** que o administrador acessa a tela de **Permissões**, **When** a tela é carregada, **Then** o sistema exibe um cabeçalho padronizado com título e descrição contextual, seguido pela listagem de usuários da equipe e seus respectivos controles de acesso para cada módulo (**Financeiro**, **ROI**, **Comunicação**, **Equipe & Acessos**).
2. **Given** que um usuário possui acesso habilitado ao módulo Financeiro, **When** o administrador visualiza a linha/cartão desse usuário na tela de Permissões, **Then** o controle do módulo **Financeiro** exibe o estado ativo **SIM** destacado visualmente.
3. **Given** que o administrador clica no botão alternador (*toggle*) do módulo **Financeiro** de um usuário para alterar de **SIM** para **NÃO**, **When** a ação é confirmada/processada, **Then** o estado muda para **NÃO**, a permissão é persistida imediatamente e o administrador recebe uma confirmação visual de atualização.
4. **Given** que existem múltiplos integrantes na equipe, **When** o administrador utiliza a busca por nome/e-mail ou filtro por perfil/equipe na tela de Permissões, **Then** a listagem exibe apenas os usuários correspondentes mantendo seus controles de módulo interativos.

---

### User Story 2 - Aplicação das Permissões na Navegação e Proteção de Acesso aos Módulos (Priority: P1)

Como integrante autenticado no sistema, quero que a barra de navegação lateral e o acesso às páginas respeitem rigorosamente as permissões (`SIM` ou `NÃO`) atribuídas ao meu usuário para cada módulo, para que eu visualize e acesse apenas os módulos para os quais possuo autorização.

**Why this priority**: Garante que a configuração visual feita pelo administrador na tela de Permissões tenha efeito real de segurança e governança sobre o que cada usuário pode ver e acessar no sistema.

**Independent Test**: Pode ser testado configurando o acesso do módulo "Financeiro" como `NÃO` para um usuário específico, autenticando-se com esse usuário (ou validando sua sessão) e verificando que o módulo "Finanças" não aparece disponível no menu lateral e que o acesso direto às rotas financeiras é bloqueado/redirecionado.

**Acceptance Scenarios**:

1. **Given** que um usuário está configurado com `Financeiro: NÃO` e `Comunicação: SIM`, **When** esse usuário acessa o sistema, **Then** o menu lateral exibe o módulo de **Comunicação**, mas oculta o módulo de **Finanças** (Dashboard Financeiro, Planejamento e Livro Caixa).
2. **Given** que um usuário possui permissão `NÃO` para determinado módulo (ex: ROI), **When** tenta acessar diretamente o endereço daquele módulo pelo navegador, **Then** o sistema impede a visualização dos dados restritos e redireciona o usuário para um módulo permitido ou exibe um aviso claro de acesso não autorizado.
3. **Given** que o administrador altera a permissão de um módulo de `NÃO` para `SIM` para um membro da equipe, **When** o membro atualiza sua navegação no sistema, **Then** o módulo recém-habilitado passa a ficar visível e acessível.

---

### User Story 3 - Prevenção de Auto-Bloqueio Administrativo e Permissões Padrão Iniciais (Priority: P2)

Como administrador responsável pela governança da equipe, quero que novos usuários cadastrados já iniciem com um conjunto padrão coerente de permissões de módulo conforme seu perfil e que o sistema impeça que eu desative meu próprio acesso ao módulo de administração/permissões, evitando que a equipe fique sem nenhum gestor com acesso à tela de Permissões.

**Why this priority**: Previne erros operacionais críticos (como um administrador trancar a si mesmo fora da tela de permissões) e reduz trabalho manual repetitivo ao cadastrar novos membros.

**Independent Test**: Pode ser testado tentando alternar para `NÃO` a permissão de acesso ao módulo de Equipe/Permissões do próprio usuário administrador logado e verificando que o controle está protegido/bloqueado com uma explicação clara.

**Acceptance Scenarios**:

1. **Given** que o administrador logado visualiza sua própria linha na tela de Permissões, **When** tenta alternar seu próprio acesso ao módulo de **Equipe & Permissões** de `SIM` para `NÃO`, **Then** o sistema impede a desativação e informa que o administrador não pode revogar o próprio acesso administrativo.
2. **Given** que um novo integrante é cadastrado na equipe, **When** o cadastro é concluído, **Then** o usuário recebe automaticamente permissões iniciais padrão por módulo compatíveis com seu papel (podendo ser customizadas a qualquer momento na tela de Permissões).

---

### Edge Cases

- **Tentativa de revogar todos os módulos de um usuário ativo**: Se um administrador definir todos os módulos de um usuário como `NÃO`, o sistema deve permitir a gravação, mas ao fazer login esse usuário verá uma tela informativa limpa ("Nenhum módulo habilitado para sua conta — solicite liberação ao administrador da equipe") em vez de entrar em loop de redirecionamento.
- **Proteção do próprio administrador**: Um administrador nunca pode colocar `NÃO` na sua própria permissão de acesso à gestão de Equipe/Permissões para evitar perda total de governança.
- **Falha de comunicação ao alternar permissão**: Caso ocorra falha de rede ou erro no servidor no momento em que o administrador clica no toggle `SIM`/`NÃO`, o botão deve reverter ao estado anterior e exibir uma notificação de erro clara ao usuário.
- **Responsividade em dispositivos móveis**: Em telas menores (smartphones), a listagem de permissões por usuário e módulo deve permitir alternar os botões `SIM`/`NÃO` confortavelmente sem quebra de layout ou truncamento dos nomes dos módulos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE disponibilizar uma tela dedicada de **Permissões** dentro do contexto administrativo (**Equipe & Acessos**), contendo obrigatoriamente um título principal e uma descrição explicativa no cabeçalho da página.
- **FR-002**: A tela de Permissões DEVE listar os usuários cadastrados exibindo nome, e-mail, função/cargo, equipe vinculada e os controles de acesso para cada módulo do sistema.
- **FR-003**: O sistema DEVE permitir configurar individualmente, para cada usuário, a permissão de acesso aos 4 módulos principais da plataforma:
  1. **Financeiro** (Dashboard Financeiro, Planejamento Orçamentário e Livro Caixa)
  2. **ROI & Patrocínio** (Visão Geral & Cotas e Ações de Retorno)
  3. **Comunicação** (Mapa Hierárquico, Gerador de Relatórios, Diretório, Agendamentos e Matriz)
  4. **Equipe & Acessos** (Gestão de Equipes, Integrantes e Permissões)
- **FR-004**: Cada permissão de módulo por usuário DEVE ser controlada por um botão alternador (*toggle button*) que apresente explicitamente o estado **SIM** (acesso permitido) ou **NÃO** (acesso bloqueado), conforme o padrão visual solicitado (`Módulo: SIM / NÃO`).
- **FR-005**: Ao clicar no toggle `SIM`/`NÃO` de um módulo, o sistema DEVE persistir a alteração imediatamente para aquele usuário e exibir feedback visual de sucesso ou erro.
- **FR-006**: O menu de navegação lateral (desktop e mobile) DEVE exibir apenas os módulos cujo acesso do usuário autenticado esteja configurado como **SIM**.
- **FR-007**: O sistema DEVE validar o acesso nas rotas de cada módulo, impedindo que um usuário com permissão **NÃO** acesse os dados ou telas daquele módulo por URL direta.
- **FR-008**: O sistema DEVE impedir que o administrador autenticado altere para **NÃO** a sua própria permissão de acesso ao módulo de **Equipe & Acessos / Permissões**.
- **FR-009**: Caso uma tabela na tela possua ações secundárias por linha (além dos toggles diretos de módulo), essas ações DEVEM seguir o padrão de botão único de engrenagem com menu suspenso.
- **FR-010**: A tela de Permissões DEVE oferecer busca rápida por nome ou e-mail do usuário para facilitar a localização de integrantes em equipes maiores.

### Key Entities

- **Permissão de Módulo do Usuário (UserModulePermissions)**: Representa o conjunto de autorizações booleanas (`SIM` = verdadeiro / `NÃO` = falso) de um usuário específico para cada módulo do sistema (`financeiro`, `roi`, `comunicacao`, `equipe`), vinculada ao registro do usuário.
- **Usuário / Integrante (User)**: Membro autenticado da plataforma que possui perfil institucional e um mapa individual de permissões de acesso aos módulos.
- **Módulo do Sistema (SystemModule)**: Cada uma das áreas funcionais de primeiro nível do sistema (Financeiro, ROI & Patrocínio, Comunicação, Equipe & Acessos) cujo acesso pode ser habilitado (`SIM`) ou desabilitado (`NÃO`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administradores conseguem localizar um usuário e alterar a permissão de qualquer módulo (`SIM` ↔ `NÃO`) em menos de 5 segundos, com apenas 1 clique no botão alternador.
- **SC-002**: 100% das alterações de permissão (`SIM` / `NÃO`) permanecem salvas após recarregar a página e passam a vigorar imediatamente na navegação do usuário afetado.
- **SC-003**: 100% das tentativas de acesso direto por URL a um módulo marcado como `NÃO` para o usuário autenticado são bloqueadas sem expor dados restritos.
- **SC-004**: 0 ocorrências de auto-bloqueio administrativo (administradores ficam impedidos em 100% dos casos de removerem o próprio acesso à gestão de permissões).

## Assumptions

- Apenas usuários com acesso administrativo ao módulo **Equipe & Acessos** (como `SUPER_ADMIN` ou gestores com permissão de Equipe habilitada como `SIM`) podem visualizar e alterar as permissões de outros usuários.
- Usuários já existentes na base de dados receberão por padrão inicial `SIM` nos módulos operacionais (Financeiro, ROI e Comunicação) e `SIM` no módulo de Equipe & Acessos caso possuam perfil de `SUPER_ADMIN`, preservando o funcionamento atual até que o administrador customize os toggles.
- A configuração `SIM` / `NÃO` por módulo controla a visibilidade e o acesso ao módulo completo e suas respectivas sub-rotas/abas.
