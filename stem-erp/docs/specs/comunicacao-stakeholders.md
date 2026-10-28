# Spec: Módulo de Comunicação com Stakeholders, Matriz de Engajamento & Relatórios

## 1. Contexto e Problema
Na gestão profissional de escuderias de alta performance (como no ecossistema **F1 in Schools** e projetos STEM de engenharia), o relacionamento com partes interessadas (*stakeholders*) é um dos pilares mais rigorosos de avaliação de gerenciamento de projeto e portfólio executivo.

Atualmente, o ERP da equipe possui módulos robustos de **Finanças** (orçamento, cronograma, livro caixa) e **ROI de Patrocinadores** (cotas, entregas de mídia e ativações), porém:
1. **Falta de canal centralizado de comunicação:** A equipe não possui uma régua estruturada para definir a frequência e o canal adequado (WhatsApp, E-mail, Reuniões) para cada stakeholder.
2. **Esforço manual para prestação de contas:** Para informar um patrocinador, a direção escolar, mentores ou pais sobre os números do time, os integrantes precisam redigir mensagens do zero, correndo risco de inconsistências de dados.
3. **Ausência da Matriz de Engajamento:** Não há uma visualização formal para avaliar o nível de influência, poder, interesse e engajamento (*Unaware*, *Resistant*, *Neutral*, *Supportive*, *Leading*).
4. **Falta de ciclos de feedback documentados:** A avaliação de bancas de engenharia e negócios exige evidências claras de que a equipe ouve seus apoiadores e aplica melhorias contínuas em seus processos.

---

## 2. Objetivos
1. **Novo Módulo `/comunicacao` no Menu Principal:** Criar um módulo completo de primeiro nível no sistema com navegação intuitiva por abas ou subpáginas.
2. **Cadastro e Segmentação de Stakeholders:** Registrar partes interessadas categorizadas por grupos específicos (Patrocinadores, Escola/Direção, Pais/Responsáveis, Mentores Técnicos, Comunidade/Torcedores, Oficiais da Competição).
3. **Matriz de Engajamento Interativa:** Mapeamento visual em quadrantes (Poder vs. Interesse) e avaliação de estágio de engajamento (Atual vs. Desejado), orientando estratégias personalizadas de relacionamento.
4. **Planos & Régua de Comunicação Regular:** Definição de periodicidade (Semanal, Quinzenal, Mensal, Bimestral, Trimestral, Por Marco/Evento) e canal preferencial (WhatsApp, E-mail, Reunião, Relatório Executivo).
5. **Gerador Automático de Relatórios com Dados Reais:**
   - **Relatório Financeiro:** Saldo em caixa, percentual de orçamento executado, total arrecadado e status do cronograma.
   - **Relatório de ROI & Patrocinador:** Relatório personalizado por empresa parceira contendo cota, total investido, contrapartidas entregues, alcance acumulado e ROI/múltiplo entregue.
   - **Arquitetura Modular:** Preparado para plugar futuros dados de Tarefas, Marcos e Objetivos de Engenharia.
   - **Formatos de Saída Instantâneos:** Texto pré-formatado para **WhatsApp** (com emojis, negritos e link direto de envio `https://wa.me/`) e versão formatada para **E-mail / Copiar**.
6. **Histórico Documentado & Ciclos de Feedback (Melhoria Contínua):** Registro de comunicações realizadas com data, responsável e canal, com campo dedicado para resposta do stakeholder, classificação de sentimento e **Ação de Melhoria Contínua** implementada pela equipe.

---

## 3. Fora de Escopo
- Envio automático de mensagens via API paga oficial da Meta (WhatsApp Business Cloud API) — a integração será feita via link direto `wa.me` com mensagem pré-carregada e disparo direto pelo dispositivo do usuário.
- Servidor próprio de envio SMTP em massa (o sistema gera o template e aciona o cliente padrão de e-mail `mailto:` ou permite copiar com 1 clique).
- Chat em tempo real dentro do sistema.

---

## 4. Regras de Negócio (RN)

| # | Regra | Detalhamento |
|---|-------|--------------|
| **RN1** | **Isolamento Multi-Equipe** | Todos os stakeholders, planos de comunicação, registros e feedbacks pertencem estritamente à equipe ativa (`teamId`). |
| **RN2** | **Vínculo com Patrocinadores** | Quando um stakeholder pertencer ao grupo `SPONSORS`, ele poderá ser opcionalmente associado a um registro existente de `Sponsor` do módulo de ROI, puxando dados de contato e cota automaticamente. |
| **RN3** | **Classificação na Matriz** | Cada stakeholder deve possuir atributos de **Nível de Poder** (`LOW`, `HIGH`), **Nível de Interesse** (`LOW`, `HIGH`), **Engajamento Atual** e **Engajamento Desejado** (`UNAWARE`, `RESISTANT`, `NEUTRAL`, `SUPPORTIVE`, `LEADING`). |
| **RN4** | **Estratégia Derivada da Matriz** | O quadrante da matriz define a abordagem recomendada:<br>• Alto Poder / Alto Interesse: *Gerenciar de Perto*<br>• Alto Poder / Baixo Interesse: *Manter Satisfeito*<br>• Baixo Poder / Alto Interesse: *Manter Informado*<br>• Baixo Poder / Baixo Interesse: *Monitorar com Mínimo Esforço*. |
| **RN5** | **Régua de Frequência** | Cada Plano de Comunicação deve conter frequência definida (`WEEKLY`, `BIWEEKLY`, `MONTHLY`, `BIMONTHLY`, `QUARTERLY`, `MILESTONE_EVENT`) e canal principal (`WHATSAPP`, `EMAIL`, `MEETING`, `REPORT_PDF`). |
| **RN6** | **Geração de Relatório de ROI por Patrocinador** | Ao gerar relatório para um patrocinador, o sistema busca na base real os lançamentos financeiros vinculados à empresa e todas as ações de retorno registradas, calculando investimento, retorno e ROI entregue. |
| **RN7** | **Geração de Relatório Financeiro Global** | O relatório financeiro compila os KPIs vigentes da temporada: saldo em caixa, total arrecadado, total gasto e itens executados. |
| **RN8** | **Formatação WhatsApp (wa.me)** | A mensagem gerada para WhatsApp deve utilizar emojis institucionais e sintaxe do mensageiro (`*negrito*`, `_itálico_`, tópicos `-`), e gerar link codificado `https://wa.me/{telefone}?text={encodedText}`. |
| **RN9** | **Ciclo de Feedback & Sentimento** | Cada comunicação realizada pode ter feedbacks registrados contendo: Data da Resposta, Sentimento (`POSITIVE`, `NEUTRAL`, `CONSTRUCTIVE_CRITICISM`), Comentários e **Ação de Melhoria Contínua**. |
| **RN10** | **Histórico Auditável** | O registro de comunicações não deve ser apagado fisicamente quando houver evidências de feedback anexadas, servindo como documento comprobatório para a banca de avaliação. |
| **RN11** | **Interface Mobile-First** | A matriz de quadrantes 2x2 no desktop deve se transformar em lista/cards agrupados por quadrante em telas móveis, garantindo legibilidade em smartphones. |
| **RN12** | **Atualização Reativa de Estado** | Qualquer registro ou alteração invalida a query de métricas do TanStack Query (`["communication-metrics"]`), mantendo dados em sincronia sem recarregar a página. |

---

## 5. Modelo de Dados (Prisma Schema)

### 5.1 Novos Enums
```prisma
enum StakeholderGroup {
  SPONSORS              // Patrocinadores e Parceiros Corporativos
  SCHOOL_LEADERSHIP     // Direção Escolar, Coordenação e Professores
  PARENTS_GUARDIANS     // Pais e Responsáveis dos Integrantes
  TECHNICAL_MENTORS     // Mentores Técnicos, Ex-Alunos e Especialistas
  COMMUNITY_FANS        // Comunidade, Alunos e Apoiadores
  COMPETITION_OFFICIALS // Organizadores da Competição e Jurados
}

enum StakeholderPower {
  LOW
  HIGH
}

enum StakeholderInterest {
  LOW
  HIGH
}

enum EngagementLevel {
  UNAWARE    // Desinformado sobre o projeto
  RESISTANT  // Resistente ou cético
  NEUTRAL    // Neutro / Ciente sem apoio ativo
  SUPPORTIVE // Apoiador ativo
  LEADING    // Líder / Defensor engajado do time
}

enum CommunicationChannel {
  WHATSAPP
  EMAIL
  MEETING
  REPORT_PDF
}

enum CommunicationFrequency {
  WEEKLY          // Semanal
  BIWEEKLY        // Quinzenal
  MONTHLY         // Mensal
  BIMONTHLY       // Bimestral
  QUARTERLY       // Trimestral
  MILESTONE_EVENT // Pós-Marco / Evento Crítico
}

enum FeedbackSentiment {
  POSITIVE              // Positivo / Elogio
  NEUTRAL               // Neutro / Informativo
  CONSTRUCTIVE_CRITICISM // Crítica Construtiva / Ponto de Atenção
}
```

### 5.2 Novas Tabelas e Relações
```prisma
model Stakeholder {
  id                   String              @id @default(cuid())
  teamId               String
  team                 Team                @relation(fields: [teamId], references: [id], onDelete: Cascade)
  sponsorId            String?             // Vínculo opcional se for patrocinador já cadastrado
  sponsor              Sponsor?            @relation(fields: [sponsorId], references: [id], onDelete: SetNull)
  name                 String              // Nome da pessoa ou entidade
  organization         String?             // Ex: Colégio Alfa, Empresa Bosch
  roleOrJobTitle       String?             // Ex: Diretor Pedagógico, Gerente de Marketing
  group                StakeholderGroup    // Grupo de Stakeholder
  email                String?
  phone                String?             // WhatsApp no formato (DD) 9XXXX-XXXX
  power                StakeholderPower    @default(LOW)
  interest             StakeholderInterest @default(LOW)
  currentEngagement    EngagementLevel     @default(NEUTRAL)
  targetEngagement     EngagementLevel     @default(SUPPORTIVE)
  preferredChannel     CommunicationChannel @default(WHATSAPP)
  preferredFrequency   CommunicationFrequency @default(MONTHLY)
  notes                String?             // Abordagem personalizada / requisitos especiais
  plans                CommunicationPlan[]
  communications       CommunicationLog[]
  createdAt            DateTime            @default(now())
  updatedAt            DateTime            @updatedAt

  @@index([teamId, group])
  @@index([teamId, power, interest])
}

model CommunicationPlan {
  id                   String                 @id @default(cuid())
  teamId               String
  team                 Team                   @relation(fields: [teamId], references: [id], onDelete: Cascade)
  stakeholderId        String
  stakeholder          Stakeholder            @relation(fields: [stakeholderId], references: [id], onDelete: Cascade)
  title                String                 // Ex: Relatório Quinzenal de Metas e Finanças
  channel              CommunicationChannel   // WHATSAPP, EMAIL, etc.
  frequency            CommunicationFrequency // WEEKLY, BIWEEKLY, MONTHLY...
  customApproach       String?                // Tom de voz e abordagem personalizada
  keyInformation       String?                // Conteúdos obrigatórios (ROI, Caixa, Protótipo)
  responsibleMemberId  String?                // Integrante da equipe responsável
  responsibleMemberName String?
  isActive             Boolean                @default(true)
  lastDispatchedAt     DateTime?
  nextDispatchDate     DateTime?
  communications       CommunicationLog[]
  createdAt            DateTime               @default(now())
  updatedAt            DateTime               @updatedAt

  @@index([teamId, stakeholderId])
}

model CommunicationLog {
  id                   String                 @id @default(cuid())
  teamId               String
  team                 Team                   @relation(fields: [teamId], references: [id], onDelete: Cascade)
  stakeholderId        String
  stakeholder          Stakeholder            @relation(fields: [stakeholderId], references: [id], onDelete: Cascade)
  planId               String?
  plan                 CommunicationPlan?     @relation(fields: [planId], references: [id], onDelete: SetNull)
  subject              String                 // Assunto / Título do envio
  channel              CommunicationChannel
  sentAt               DateTime               @default(now())
  dispatchedByName     String                 // Nome do integrante que realizou o disparo
  contentSummary       String                 // Conteúdo da mensagem enviada
  reportTypeIncluded   String?                // "FINANCIAL", "ROI", "COMBINED" ou "CUSTOM"
  evidenceLink         String?                // Link do anexo / screenshot da conversa / ata
  feedbacks            CommunicationFeedback[]
  createdAt            DateTime               @default(now())
  updatedAt            DateTime               @updatedAt

  @@index([teamId, stakeholderId, sentAt])
}

model CommunicationFeedback {
  id                       String            @id @default(cuid())
  communicationLogId       String
  communicationLog         CommunicationLog  @relation(fields: [communicationLogId], references: [id], onDelete: Cascade)
  receivedAt               DateTime          @default(now())
  sentiment                FeedbackSentiment
  stakeholderResponse      String            // Resumo do retorno do stakeholder
  continuousImprovementAction String?        // Ação de melhoria implementada pelo time com base no retorno
  isAddressed              Boolean           @default(false)
  createdAt                DateTime          @default(now())
  updatedAt                DateTime          @updatedAt

  @@index([communicationLogId])
}
```

---

## 6. Arquitetura das Telas e Componentes (Mobile-First)

### 6.1 Estrutura de Navegação (`/comunicacao`)
O módulo será dividido em 4 visões com alternância rápida por abas (`Tabs` ou subpáginas):
1. **Painel Geral & Métricas (`Overview`):**
   - KPI Cards: Total de Stakeholders mapeados, Taxa de Engajamento Líder/Apoiador, Comunicações realizadas no mês, Feedbacks com Melhoria Contínua aplicada.
   - Régua de Próximos Envios (Cards de alertas para comunicações que vencem na semana).
2. **Matriz de Engajamento (`Matrix`):**
   - Visão em 4 Quadrantes (Poder vs. Interesse):
     - *Gerenciar de Perto* (Alto Poder, Alto Interesse)
     - *Manter Satisfeito* (Alto Poder, Baixo Interesse)
     - *Manter Informado* (Baixo Poder, Alto Interesse)
     - *Monitorar* (Baixo Poder, Baixo Interesse)
   - Tabela comparativa de Estágio de Engajamento: Atual vs. Desejado (*Gap Analysis*).
3. **Gerador de Relatórios WhatsApp & E-mail (`Report Generator`):**
   - Seletor do Stakeholder ou Tipo de Relatório (Financeiro ou ROI de Patrocínio).
   - *Preview* em tempo real com dados da temporada ativa.
   - Botões de Ação:
     - **"Abrir no WhatsApp"** (Gera link `https://wa.me/55...` com texto pré-preenchido).
     - **"Copiar para WhatsApp"** (Copia texto com formatação de zap).
     - **"Copiar para E-mail"** (Copia formato executivo com assunto estruturado).
4. **Registro & Ciclos de Feedback (`History & Feedbacks`):**
   - Linha do tempo / Tabela de comunicações enviadas.
   - Botão para **Registrar Feedback Recebido & Ação de Melhoria Contínua**.
   - Filtros por Stakeholder, Canal e Sentimento.

---

## 7. Templates do Gerador de Relatórios

### 7.1 Template WhatsApp: Módulo Financeiro
```text
🏁 *RELATÓRIO FINANCEIRO EXECUTIVO — {NOME DA EQUIPE}*
Temporada Oficial: {TEMPORADA}
Data de Emissão: {DATA}

Olá, *{NOME DO STAKEHOLDER}*!
Apresentamos o resumo transparente da saúde financeira da nossa equipe:

💰 *Visão Geral de Caixa:*
• Saldo Atual em Caixa: *R$ {SALDO}*
• Total Arrecadado: *R$ {ARRECADADO}*
• Total Executado em Gastos: *R$ {GASTOS}* ({% EXECUÇÃO} do orçamento)

📊 *Status do Cronograma Físico-Financeiro:*
• Recursos Planejados: *{TOTAL_ITENS} itens*
• Eficiência de Custos: Margem de *{MARGEM}%* sobre o total arrecadado

Caso deseje mais detalhes ou prestação de contas dos comprovantes fiscais, estamos à inteira disposição!

Atenciosamente,
*Gestão Financeira & Comunicação — {NOME DA EQUIPE}*
```

### 7.2 Template WhatsApp: Módulo ROI do Patrocinador
```text
🤝 *RELATÓRIO DE RETORNO SOBRE INVESTIMENTO (ROI) — {NOME DA EMPRESA}*
Parceria: Cota *{COTA}*
Equipe: *{NOME DA EQUIPE}* ({ESCOLA})

Olá, *{CONTATO}*!
É com grande satisfação que apresentamos a comprovação do valor gerado pela nossa parceria:

📈 *Indicadores de Retorno da Marca:*
• Investimento Aportado: *R$ {VALOR_INVESTIDO}*
• Retorno Entregue pela Equipe: *R$ {VALOR_RETORNO}*
• ROI Entregue: *+{ROI_PERCENT}%* (Múltiplo de *{MULTIPLO}x*)

📣 *Ativações Realizadas no Período:*
{LISTA_ACOES_E_ALCANCE}
• Total de Visualizações e Impacto: *{ALCANCE_TOTAL} pessoas*

Obrigado por acelerar junto com nossa equipe rumo ao campeonato!

Atenciosamente,
*Diretoria de Marketing & Parcerias — {NOME DA EQUIPE}*
```

---

## 8. Estratégia de Testes Automatizados
Seguindo a **Regra #7** do agente de frontend:
1. **Testes Unitários (`kpi / template tests` via `tsx --test`):**
   - Testar a função pura de geração do template de WhatsApp garantindo formatação correta de moeda, quebra de linha e escape de caracteres URL para o link `wa.me`.
   - Testar a função de classificação da Matriz de Stakeholders (Poder vs. Interesse e identificação do quadrante correto).
   - Testar o cálculo de *gap* de engajamento (distância entre atual e desejado).
2. **Testes de Integração & Componentes:**
   - Testar formulário de criação de stakeholder com validações do Zod.
   - Testar alternância entre as abas e renderização dos 4 estados (Loading, Empty, Success, Error).
   - Testar o fluxo de registro de feedback com ação de melhoria contínua.
3. **Testes de Responsividade:**
   - Garantir que a Matriz de Engajamento renderize em grade 2x2 no desktop e em lista de cards no mobile.

---

## 9. Plano de Execução em Fases

- **Fase 1: Modelo de Dados & Migração Prisma**
  - Criação dos novos Enums e Models no `schema.prisma`.
  - Execução de `prisma generate` e validação dos tipos.
- **Fase 2: Services e Server Actions**
  - Criação de `src/services/communication-service.ts` com queries seguras isoladas por `teamId`.
  - Criação de `src/actions/communication-actions.ts` para CRUD de stakeholders, planos, logs e feedbacks.
  - Implementação de utilitários puros para geração de templates WhatsApp e E-mail (`src/lib/communication-templates.ts`).
- **Fase 3: Visão e Componentes de UI (Mobile-First)**
  - Criação da página `src/app/comunicacao/page.tsx`.
  - Componentes da Matriz de Engajamento (`stakeholder-matrix.tsx`).
  - Gerador interativo de relatórios (`report-generator-view.tsx`).
  - Linha do tempo de comunicações e feedbacks com melhoria contínua (`communication-logs-view.tsx`).
  - Modais de cadastro e edição (`create-stakeholder-dialog.tsx`, `log-communication-dialog.tsx`, `add-feedback-dialog.tsx`).
- **Fase 4: Integração na Navegação & Sidebar**
  - Adição do módulo **Comunicação** na Sidebar e no Mobile Nav Drawer.
- **Fase 5: Testes Automatizados & Validação CI**
  - Criação de testes unitários para templates e matriz.
  - Validação com `npm test`, `npx tsc --noEmit`, `npm run lint` e `npm run build`.
