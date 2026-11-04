# Phase 0 Research: Envio Automatizado de Relatórios por E-mail & Calendário de Agendamentos

**Feature Branch**: `002-automated-email-dispatch`
**Created**: 2026-11-04
**Status**: Complete

---

## 1. Biblioteca de Disparo de E-mails para `genesisteamracing@gmail.com`

### Decision
Adotar **`nodemailer`** (`^6.x` + `@types/nodemailer`) integrado em uma camada de serviço dedicada (`stem-erp/src/services/email-service.ts`), operando com transporte SMTP do Gmail (`smtp.gmail.com`, porta `465` SSL ou `587` STARTTLS) autenticado via Senha de App (`SMTP_USER` / `SMTP_PASS`) e com modo de simulação seguro (*dry-run* / *graceful fallback*) quando credenciais SMTP não estiverem definidas no ambiente local ou de testes automatizados.

### Rationale
- **Compatibilidade com `@gmail.com`**: O requisito exige explicitamente que o e-mail padrão de envio da equipe seja `genesisteamracing@gmail.com` (ou outro endereço configurado na tela `Equipe & Acessos`). Provedores de API HTTP como Resend, SendGrid ou AWS SES bloqueiam envios com remetente `@gmail.com` por políticas DMARC/SPF e exigem verificação de domínio próprio com registros DNS TXT/MX.
- **Padrão Consolidado em Node.js / Next.js Server Actions**: O `nodemailer` executa exclusivamente no runtime Node.js das Server Actions (`"use server"`), permitindo enviar payload `html` e `text` simultaneamente, configurar cabeçalho `from: "Gênesis Racing <genesisteamracing@gmail.com>"` e `replyTo` com o `senderEmail` dinâmico configurado pela equipe.
- **Testabilidade Determinística**: Ao encapsular o transporte em `email-service.ts`, os testes unitários e de integração (`tsx --test`) podem validar a montagem do envelope, validação de destinatário/remetente e registro automático em `CommunicationLog` sem depender de rede externa.

### Alternatives Considered
- **Resend SDK (`resend`)**: Rejeitado como motor primário porque não permite enviar a partir de `@gmail.com` sem domínio próprio verificado (apenas para o próprio e-mail do dono da conta em modo sandbox).
- **`mailto:` Client-Side Redirect**: Rejeitado porque o usuário solicitou explicitamente automatizar o envio apertando apenas um botão na interface, sem depender de abrir cliente externo de e-mail do sistema operacional.

---

## 2. Motor Puro de Cálculo de Datas de Agendamento (`src/lib/communication-schedule.ts`)

### Decision
Implementar um módulo puro e determinístico `stem-erp/src/lib/communication-schedule.ts` que recebe a lista de stakeholders da equipe (`StakeholderWithRelations[]`) e um mês/ano alvo (`year: number`, `month: number` de `0` a `11`) e projeta todos os envios automáticos de **Relatório Executivo Completo** (`COMBINED`) a partir da data de cadastro (`createdAt`) e da periodicidade (`preferredFrequency`) de cada stakeholder.

### Rationale
- **Regra de Negócio Exata**:
  - Se um stakeholder foi cadastrado no dia 04 (`createdAt = 2026-11-04`) com periodicidade `WEEKLY` (Semanal), os próximos envios automáticos ocorrem em `createdAt + 7k` dias ($k \ge 1$): dias 11, 18, 25...
  - Para `BIWEEKLY` (Quinzenal): `createdAt + 14k` dias ($k \ge 1$).
  - Para `MONTHLY` (Mensal), `BIMONTHLY` (Bimestral = 2 meses), `QUARTERLY` (Trimestral = 3 meses) e `SEMIANNUALLY` (Semestral = 6 meses): projeção nos meses subsequentes ($m \ge 1$ múltiplos do intervalo em meses) mantendo o mesmo dia do mês de `createdAt` (com *clamping* seguro para o último dia do mês em meses mais curtos, ex.: 31 de janeiro -> 28/29 de fevereiro).
- **Zero Complexidade Desnecessária no Banco**: Como o cálculo é uma função matemática pura sobre `(createdAt, preferredFrequency)`, o calendário reflete instantaneamente qualquer novo stakeholder cadastrado ou mudança de periodicidade, sem necessidade de *cron jobs* gerando linhas órfãs no banco para cada mês futuro.
- **Princípio SRP (SOLID)**: A lógica de calendário (geração da grade de 42 células ou semanas do mês, agrupamento por `YYYY-MM-DD`, cálculo do próximo envio de cada stakeholder) fica 100% isolada e testável em `src/lib/communication-schedule.ts`.

### Alternatives Considered
- **Tabela de Agendamentos Materializada no Banco**: Rejeitada porque exigiria recálculo em lote toda vez que um stakeholder fosse criado, editado ou removido, além de limitar o horizonte de navegação no calendário.

---

## 3. UI do Calendário Mensal com Círculo Azul Transparente e Pop-up no Hover

### Decision
Construir o componente `CommunicationScheduleTab` (`stem-erp/src/components/communication/communication-schedule-tab.tsx`) utilizando `tailwind-variants` (`tv`) e tokens semânticos do Design System:
- **Indicador Visual do Dia Agendado**: Quando um dia do calendário possui 1 ou mais relatórios agendados, o número do dia é envolvido por um **círculo azul transparente** (`rounded-full bg-primary/15 border border-primary/60 text-primary font-bold`), representando visualmente o formato `(1)` ou `(11)` solicitado pelo usuário.
- **Pop-up no Hover / Focus**: Ao passar o mouse (*hover*) ou focar via teclado (`group-hover` / `group-focus-within`) sobre o dia agendado, um pop-up flutuante (`role="tooltip"`) exibe a descrição detalhada do que está agendado para aquele dia:
  - Título do agendamento: **Relatório Executivo Completo (Envio Automático)**
  - Lista de stakeholders contemplados no dia (Nome, Organização/Grupo, Periodicidade e E-mail de destino)
  - Ação rápida opcional para ir direto ao envio/gerador daquele stakeholder.

### Rationale
- **Conformidade com `AGENTS.md`**: Zero cores hexadecimais ou arbitrárias; uso exclusivo de `bg-primary/15`, `border-primary/60`, `text-primary`, `bg-popover`, `text-popover-foreground` e `border-border`.
- **Acessibilidade e Mobile-First**: Além do *hover* no desktop, o usuário em dispositivos touch ou teclado pode clicar/focar no dia agendado para visualizar os mesmos detalhes do pop-up e ver a lista consolidada de próximos envios do mês.

### Alternatives Considered
- **Lista Simples de Logs Passados**: Substituída conforme solicitação explícita do usuário para transformar a aba "Histórico" em "Agendamentos" em formato calendário.

---

## 4. Persistência do E-mail de Envio (`senderEmail`) em `Equipe & Acessos` (`/equipe`)

### Decision
Adicionar o campo `senderEmail String @default("genesisteamracing@gmail.com")` ao modelo `Team` em `stem-erp/prisma/schema.prisma`, expor esse campo nas métricas de equipe (`getTeamManagementMetricsAction` e `resolveActiveTeam`) e criar o componente `TeamSenderEmailCard` (`stem-erp/src/components/forms/team-sender-email-card.tsx`) na página `stem-erp/src/app/equipe/page.tsx`.

### Rationale
- **Isolamento Multi-Equipe**: No Gênesis ERP, as configurações pertencem à equipe ativa (`Team`). Armazenar `senderEmail` diretamente no registro `Team` garante que o valor padrão seja `genesisteamracing@gmail.com` e que qualquer alteração feita na tela `Equipe & Acessos` persista no banco PostgreSQL e seja imediatamente utilizada pelo módulo de Comunicação.
- **Validação Forte com Zod**: Um schema `updateTeamSenderEmailSchema` valida formato de e-mail válido (`z.string().trim().email()`), bloqueia perfis `AUDITOR` (somente leitura) e registra a alteração para rastreabilidade.
