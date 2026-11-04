# Feature Specification: Disparo Automatizado de E-mail, Calendário de Agendamentos e Configuração de Remetente

**Feature Branch**: `002-automated-email-dispatch`
**Created**: 2026-11-04
**Status**: Draft
**Input**: User description: "Eu gostaria de automatizar isso para apertar apenas um botão e enviar email. Verifique uma Lib para isso. crie um botão de enviar email. o email de envio será genesisteamracing@gmail.com na parte equipe & acessos. deixe um input para eu poder alterar o email de envio. Atualize essa spec-02 para trocar a parte historica para agendamentos. Nessa tela será mostrado em formato calendario o próximo relátorio que será enviado de maneira automaticatica de acordo com a peridiocidade que foi inserida. Exemplo coloquei dia 04 um stakeholder para receber semanalmente então na próxima semana automaticamente ele recebera um relatório completo. E isso aparecerá no calendario com um circulo transparente azul envolta do dia exemplo: (1). Ao passar o mouse por cima aparecerá um pop-up mostrando uma descrição do que está agendado para aquele dia."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Calendário de Agendamentos Automáticos por Periodicidade (Priority: P1)

Como integrante da equipe, quero que a seção anteriormente chamada de "Histórico" seja substituída por **"Agendamentos"**, exibindo um calendário mensal onde são projetados os próximos envios automáticos de relatórios completos para cada stakeholder de acordo com a periodicidade cadastrada (ex: se um stakeholder foi cadastrado no dia 04 com periodicidade semanal, o próximo envio automático de relatório completo ocorrerá 7 dias depois e nos ciclos subsequentes), destacando os dias agendados com um círculo azul transparente ao redor do número do dia e exibindo um pop-up descritivo ao passar o mouse por cima.

**Why this priority**: Substitui o registro passivo de histórico por uma visão preditiva e automatizada de agendamentos em calendário, garantindo que nenhum parceiro ou patrocinador deixe de receber sua prestação de contas no prazo definido pela sua periodicidade.

**Independent Test**: Pode ser testado cadastrando um stakeholder no dia 04 com periodicidade "Semanal", abrindo a tela "Agendamentos" no menu de Comunicação, verificando que o dia correspondente da semana seguinte (dia 11) exibe um círculo azul transparente ao redor do número e que, ao passar o mouse sobre esse dia, abre-se um pop-up descrevendo o envio automático do Relatório Completo para aquele stakeholder.

**Acceptance Scenarios**:

1. **Given** que o usuário expande o módulo de Comunicação na barra lateral, **When** visualiza os submódulos disponíveis, **Then** o antigo item "Histórico" aparece substituído por **"Agendamentos"**.
2. **Given** que um stakeholder foi cadastrado em uma data base (ex: dia 04) com periodicidade definida (ex: Semanal), **When** o usuário acessa a tela de **Agendamentos**, **Then** o calendário calcula os próximos ciclos de envio automático (ex: dia 11, 18, 25) e exibe um **círculo azul transparente** ao redor do número de cada dia que possui envio programado.
3. **Given** que um dia no calendário possui um ou mais relatórios agendados (destacado com o círculo azul transparente), **When** o usuário passa o mouse (*hover*) sobre esse dia, **Then** o sistema exibe imediatamente um **pop-up** detalhando o que está agendado para aquela data (nome do stakeholder, organização, envio automático de Relatório Completo e periodicidade).
4. **Given** que a data programada de um agendamento é atingida, **When** o ciclo automático é processado, **Then** o stakeholder recebe automaticamente por e-mail o Relatório Executivo Completo gerado pelo endereço de envio da equipe.

---

### User Story 2 - Envio Imediato de Relatório por E-mail com Um Clique (Priority: P1)

Como integrante responsável pela comunicação da equipe, ao utilizar o Gerador de Relatórios para um stakeholder cadastrado, quero clicar em um único botão **"Enviar E-mail"** na aba de prévia de E-mail (removendo o antigo botão de registrar manualmente no histórico) para que o relatório seja disparado imediatamente para o e-mail do destinatário.

**Why this priority**: Permite o disparo imediato sob demanda com apenas um clique, eliminando o fluxo manual de copiar texto/HTML e registrar histórico manualmente.

**Independent Test**: Pode ser testado gerando um relatório para um stakeholder com e-mail válido e clicando em "Enviar E-mail", confirmando o disparo direto usando o remetente configurado pela equipe.

**Acceptance Scenarios**:

1. **Given** que o usuário gerou um relatório para um stakeholder com e-mail cadastrado, **When** visualiza a aba de E-mail na prévia e clica no botão **"Enviar E-mail"**, **Then** o sistema transmite o e-mail formatado para o endereço do stakeholder usando o e-mail remetente da equipe e exibe confirmação de sucesso.
2. **Given** que a seção de histórico manual foi substituída por Agendamentos, **When** o usuário visualiza as ações da prévia do relatório, **Then** o antigo botão "Registrar Envio no Histórico" não é mais exibido, mantendo o botão principal **"Enviar E-mail"** e as opções de cópia.
3. **Given** que o e-mail está sendo enviado após o clique, **When** a entrega está em processamento, **Then** o botão permanece desabilitado com indicador visual de envio para evitar disparos duplicados.

---

### User Story 3 - Configuração do E-mail de Envio em Equipe & Acessos (Priority: P2)

Como administrador no módulo **Equipe & Acessos**, quero visualizar e editar o endereço de e-mail oficial de envio da equipe (inicializado por padrão como `genesisteamracing@gmail.com`), para que tanto os disparos com um clique quanto os envios automáticos agendados utilizem o endereço institucional definido pela escuderia.

**Why this priority**: Oferece flexibilidade administrativa para consultar ou atualizar o e-mail remetente da equipe diretamente pela interface.

**Independent Test**: Pode ser testado acessando "Equipe & Acessos", verificando o campo preenchido com `genesisteamracing@gmail.com`, alterando para outro e-mail válido, salvando e confirmando a persistência.

**Acceptance Scenarios**:

1. **Given** que a equipe ainda não alterou o e-mail remetente, **When** o administrador acessa **Equipe & Acessos**, **Then** o campo de entrada exibe `genesisteamracing@gmail.com`.
2. **Given** que o administrador edita o campo de e-mail de envio em **Equipe & Acessos** com um endereço válido e salva, **When** a operação conclui, **Then** o novo endereço passa a ser utilizado como remetente padrão da equipe e uma mensagem de sucesso é apresentada.
3. **Given** que o administrador digita um e-mail com formato inválido, **When** tenta salvar, **Then** o sistema impede a gravação e exibe um alerta de validação.

---

### Edge Cases

- **Múltiplos stakeholders agendados para o mesmo dia no calendário**: O dia permanece destacado com o círculo azul transparente e o pop-up ao passar o mouse lista todos os relatórios agendados para aquela data de forma organizada.
- **Meses com diferentes quantidades de dias (28, 30, 31) em periodicidades mensais/bimestrais**: Se um stakeholder foi cadastrado no dia 31 e o mês seguinte possui 30 dias, o agendamento ajusta-se para o último dia válido do mês correspondente sem pular o ciclo.
- **Navegação entre meses no calendário**: Ao avançar ou retroceder os meses no calendário de Agendamentos, o sistema projeta dinamicamente os ciclos futuros de acordo com a periodicidade de cada stakeholder.
- **Stakeholder sem endereço de e-mail cadastrado**: No envio manual com 1 clique, o sistema alerta que o stakeholder não possui e-mail cadastrado; no calendário de Agendamentos, o pop-up indica caso o contato ainda precise de e-mail preenchido para receber o disparo automático.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE substituir a seção e o item de menu **"Histórico"** por **"Agendamentos"** em toda a navegação do módulo de Comunicação (barra lateral desktop e menu mobile).
- **FR-002**: A tela de **Agendamentos** DEVE exibir uma visualização em formato de **Calendário** mensal, permitindo navegar entre meses e visualizar os dias do mês.
- **FR-003**: O sistema DEVE calcular e agendar automaticamente as datas dos próximos envios de **Relatório Executivo Completo** para cada stakeholder a partir da sua data base (data de cadastro ou último disparo) somada à sua periodicidade configurada (`Semanal` = a cada 7 dias, `Quinzenal` = a cada 14 dias, `Mensal` = a cada 1 mês, `Bimestral` = a cada 2 meses, `Trimestral` = a cada 3 meses, `Semestral` = a cada 6 meses).
- **FR-004**: Todo dia no calendário que possuir ao menos um relatório agendado DEVE ser destacado visualmente com um **círculo azul transparente** ao redor do número do dia.
- **FR-005**: Ao passar o mouse (*hover*) sobre um dia destacado no calendário, o sistema DEVE exibir um **pop-up** contendo a descrição dos envios agendados para aquele dia (nome do stakeholder, organização/grupo, indicação de "Relatório Executivo Completo" automático e periodicidade).
- **FR-006**: O sistema DEVE processar o envio automático do Relatório Executivo Completo por e-mail para os stakeholders agendados na data programada.
- **FR-007**: Na prévia de E-mail do Gerador de Relatórios, o sistema DEVE substituir o botão "Registrar Envio no Histórico" pelo botão **"Enviar E-mail"**, realizando o disparo imediato do relatório em 1 clique para o e-mail do stakeholder selecionado.
- **FR-008**: O sistema DEVE utilizar `genesisteamracing@gmail.com` como endereço de e-mail de envio padrão da equipe.
- **FR-009**: O módulo **Equipe & Acessos** DEVE disponibilizar um campo de entrada (input) para visualizar e alterar o endereço de e-mail de envio da equipe, validando o formato de e-mail antes de persistir.

### Key Entities *(include if feature involves data)*

- **Equipe (Team)**: Armazena o endereço de e-mail remetente oficial da equipe (`senderEmail`), inicializado com `genesisteamracing@gmail.com`.
- **Stakeholder**: Possui a data de criação (`createdAt`), endereço de e-mail (`email`) e a periodicidade preferencial (`preferredFrequency`), que servem de base para o cálculo automático das datas no calendário de Agendamentos.
- **Agendamento de Relatório (ScheduledReportEvent)**: Projeção de calendário derivada da data base e periodicidade de cada stakeholder, contendo a data do envio programado, o destinatário, a periodicidade e a descrição do Relatório Executivo Completo a ser enviado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos stakeholders cadastrados têm seus próximos ciclos de recebimento de relatório projetados automaticamente no calendário de **Agendamentos** de acordo com sua periodicidade logo após o cadastro.
- **SC-002**: Ao passar o mouse sobre qualquer dia marcado com o círculo azul transparente no calendário, o pop-up descritivo é exibido instantaneamente (em menos de 200ms) com os detalhes do agendamento.
- **SC-003**: Usuários conseguem disparar manualmente um relatório por e-mail no Gerador de Relatórios em apenas 1 clique no botão "Enviar E-mail".
- **SC-004**: Administradores conseguem visualizar o remetente padrão `genesisteamracing@gmail.com` e atualizar o e-mail de envio em **Equipe & Acessos** em menos de 30 segundos.

## Assumptions

- O tipo de relatório enviado automaticamente nos ciclos do calendário de Agendamentos é sempre o **Relatório Executivo Completo** (combinando indicadores Financeiros e de ROI/Entregas).
- A data de referência inicial para o cálculo da periodicidade de cada stakeholder no calendário é a data em que o stakeholder foi cadastrado (ex: cadastrado dia 04 com periodicidade semanal -> próximos envios nos dias 11, 18, 25, etc.).
- O e-mail remetente padrão para todas as comunicações é `genesisteamracing@gmail.com`, podendo ser alterado a qualquer momento na tela **Equipe & Acessos**.
