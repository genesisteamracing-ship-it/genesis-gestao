# Quickstart: Envio Automatizado de Relatórios por E-mail & Calendário de Agendamentos

**Feature Branch**: `002-automated-email-dispatch`
**Created**: 2026-11-04

---

## 1. Instalação de Dependências e Migração de Banco

No diretório `stem-erp/`:

```bash
cd stem-erp
npm install nodemailer
npm install -D @types/nodemailer
npx prisma db push
```

---

## 2. Variáveis de Ambiente Opcionais para SMTP Real (`.env`)

O e-mail remetente padrão da equipe é configurado no banco como `genesisteamracing@gmail.com` e pode ser alterado a qualquer momento na tela **Equipe & Acessos** (`/equipe`).

Para disparo SMTP real via Gmail, adicione ao `.env`:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="genesisteamracing@gmail.com"
SMTP_PASS="sua-senha-de-app-do-google"
```

> **Nota de Desenvolvimento/Teste**: Caso `SMTP_PASS` não esteja definida no ambiente local, o `email-service.ts` executa em modo de simulação segura (*simulated dispatch*), validando todos os dados, registrando o envio no banco de dados e retornando sucesso com indicação de ambiente local.

---

## 3. Como Testar as Funcionalidades na UI

1. **Configurar E-mail de Envio em Equipe & Acessos (`/equipe`)**:
   - Acesse **Equipe & Acessos** na barra lateral.
   - Localize o card **Configuração de E-mail de Envio**.
   - Verifique que o campo exibe `genesisteamracing@gmail.com` por padrão e teste alterar/salvar o endereço.
2. **Disparar E-mail com 1 Clique (`/comunicacao?tab=relatorios`)**:
   - Acesse **Comunicação > Relatórios**.
   - Selecione um stakeholder com e-mail cadastrado e clique em **Gerar Prévia do Relatório**.
   - Na prévia gerada, clique no botão **Enviar E-mail**.
3. **Visualizar Calendário de Agendamentos (`/comunicacao?tab=agendamentos`)**:
   - Acesse **Comunicação > Agendamentos** na barra lateral.
   - Verifique os dias destacados com um **círculo azul transparente ao redor do número do dia**, ex: `(11)`.
   - Passe o mouse (*hover*) sobre um dia destacado para abrir o **pop-up** mostrando a descrição do agendamento automático de **Relatório Executivo Completo** de acordo com a periodicidade do stakeholder.

---

## 4. Execução dos Testes Automatizados

```bash
cd stem-erp
npm test
```
