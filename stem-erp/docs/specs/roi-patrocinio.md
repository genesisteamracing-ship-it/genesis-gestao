# Spec: Gestão de Patrocinadores, Ações de Retorno e ROI Real por Empresa

## 1. Contexto e Problema
Atualmente o módulo de **ROI (`/roi`)** opera apenas como um simulador estático em memória e uma visão agregada por setor orçamentário. Não existe o cadastro real de **Empresas Patrocinadoras**, nem o vínculo direto entre os **Lançamentos Financeiros de Patrocínio** e a empresa aportadora, tampouco o registro auditável das **Ações de Retorno** executadas pela equipe para comprovar o retorno entregue a cada patrocinador.

## 2. Objetivos
1. **Cadastro de Empresas Patrocinadoras na aba ROI**: permitir adicionar e gerenciar empresas parceiras da equipe, classificadas por **Cota de Patrocínio** (`Bronze`, `Prata`, `Ouro`, `Diamante`).
2. **Vínculo de Patrocínio no Lançamento de Transação**: toda vez que o usuário lançar/editar uma transação e selecionar **Patrocínio** (via Método Comprobatório `Contrato de Patrocínio`, Setor `Marketing & Patrocínio` ou item do orçamento com estratégia `Patrocínio Financeiro` / `Permuta`), habilitar o campo para selecionar a **Empresa Patrocinadora**.
3. **Cálculo Automático do Investimento por Empresa**: o valor investido por cada patrocinador deve ser calculado automaticamente a partir da soma dos lançamentos (`Transaction`) vinculados àquela empresa.
4. **Menu de Cadastro de Ações de Retorno**: disponibilizar um módulo dedicado no menu lateral (dentro de ROI) para registrar as ações realizadas pela equipe que geraram retorno de mídia/exposição/ativação para os patrocinadores.
5. **Dashboard Visual e Gráficos Intuitivos no ROI**: exibir KPIs reais, cards/ranking por cota (`Bronze`, `Prata`, `Ouro`, `Diamante`) e gráficos comparativos (`Investimento vs. Retorno por Empresa` e `Distribuição por Cota / Tipo de Ação`).

## 3. Fora de Escopo
- Integração automática com APIs externas de redes sociais (Instagram/TikTok/YouTube Ads).
- Portal de login externo exclusivo para patrocinadores (acesso continua via perfis da equipe/auditoria).
- Emissão automática de boletos ou contratos jurídicos em PDF.

## 4. Regras de Negócio
| # | Regra |
|---|-------|
| **RN1** | Cada **Empresa Patrocinadora (`Sponsor`)** pertence exclusivamente a uma equipe (`teamId`) e possui obrigatoriamente um nome único na equipe e uma **Cota (`SponsorTier`)**: `BRONZE`, `SILVER` (Prata), `GOLD` (Ouro) ou `DIAMOND` (Diamante). |
| **RN2** | No modal de **Lançar/Editar Transação**, o campo **Empresa Patrocinadora (`sponsorId`)** é habilitado quando a transação envolve patrocínio (`trackingMethod === "SPONSOR_CONTRACT"`, `deliveryGroup === "MARKETING_SPONSOR"` ou vínculo a `BudgetResource` com `FINANCIAL_SPONSOR` / `BARTER_PARTNERSHIP`). Quando `trackingMethod === "SPONSOR_CONTRACT"`, a seleção da empresa é **obrigatória**. |
| **RN3** | O **Investimento Realizado (`investedCents`)** de uma empresa é a soma de `amountCents` de todas as transações vinculadas a `sponsorId` na equipe ativa. |
| **RN4** | Cada **Ação de Retorno (`ReturnAction`)** registra uma entrega feita pela equipe (ex.: exposição de logo no carro/uniforme, postagem em redes sociais, ativação no Pit Display, oficina social, imprensa), contendo data, categoria da ação, descrição, alcance/impressões opcionais, **Empresa Patrocinadora beneficiada (`sponsorId`)** e o **Valor de Retorno Entregue (`returnCents`)**. |
| **RN5** | O **Retorno Acumulado (`deliveredReturnCents`)** de uma empresa é a soma de `returnCents` de todas as `ReturnAction` vinculadas a `sponsorId`. |
| **RN6** | O **ROI da Empresa (%)** é calculado por: $\text{ROI (\%)} = \text{round}\left(\frac{\text{Retorno} - \text{Investimento}}{\text{Investimento}} \times 100\right)$ quando $\text{Investimento} > 0$, e o **Múltiplo de Retorno** por $\frac{\text{Retorno}}{\text{Investimento}}$ (ex.: `2.4x`). |
| **RN7** | O menu lateral (**Sidebar**) transforma o item **ROI** em um grupo expansível (mesmo padrão de *Finanças*) contendo: **1. Visão Geral (`/roi`)** e **2. Ações de Retorno (`/roi/acoes`)**. |
| **RN8** | Toda mutação (criar/editar/excluir empresa, ação de retorno ou transação) invalida a query `["dashboard-metrics"]` do TanStack Query para atualização imediata dos gráficos e indicadores. |

## 5. Modelo de Dados (Prisma)

### 5.1 Novos Enums
```prisma
enum SponsorTier {
  BRONZE   // Cota Bronze
  SILVER   // Cota Prata
  GOLD     // Cota Ouro
  DIAMOND  // Cota Diamante
}

enum ReturnActionCategory {
  CAR_UNIFORM_BRANDING // Logo no Carro / Uniforme / Equipamentos
  SOCIAL_MEDIA         // Publicação / Reels / Stories em Redes Sociais
  PIT_DISPLAY_EVENT    // Exposição em Pit Display / Estande / Eventos
  PRESS_PORTFOLIO      // Imprensa / Portfólio Oficial / Apresentações
  SOCIAL_WORKSHOP      // Ação / Oficina em Projeto Social
  OTHER_ACTIVATION     // Outras Ativações de Marca
}
```

### 5.2 Novas Tabelas e Relações
```prisma
model Sponsor {
  id            String         @id @default(cuid())
  teamId        String
  team          Team           @relation(fields: [teamId], references: [id], onDelete: Cascade)
  name          String         // Ex: Bosch, SENAI, Metalúrgica Alpha
  tier          SponsorTier    // BRONZE, SILVER, GOLD, DIAMOND
  contactName   String?        // Opcional: Nome do ponto focal
  notes         String?        // Opcional: Contrapartidas combinadas
  transactions  Transaction[]
  returnActions ReturnAction[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@unique([teamId, name])
  @@index([teamId, tier])
}

model ReturnAction {
  id          String               @id @default(cuid())
  teamId      String
  team        Team                 @relation(fields: [teamId], references: [id], onDelete: Cascade)
  sponsorId   String
  sponsor     Sponsor              @relation(fields: [sponsorId], references: [id], onDelete: Cascade)
  date        DateTime             // Data da ação realizada
  title       String               // Ex: Reels de Usinagem CNC com marca exposta
  category    ReturnActionCategory
  reachCount  Int?                 // Alcance / Impressões / Público impactado (opcional)
  returnCents Int                  // Valoração financeira do retorno entregue (em centavos)
  description String?              // Detalhamento ou link/evidência para auditoria
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt

  @@index([teamId, sponsorId, date])
}
```

### 5.3 Alteração em `Transaction` e `Team`
```prisma
model Transaction {
  // ... campos existentes
  sponsorId String?
  sponsor   Sponsor? @relation(fields: [sponsorId], references: [id], onDelete: SetNull)

  @@index([teamId, sponsorId])
}

model Team {
  // ... campos existentes
  sponsors      Sponsor[]
  returnActions ReturnAction[]
}
```

## 6. Arquitetura e Organização de Arquivos

```text
src/
├── lib/
│   ├── constants.ts                             # Labels para SponsorTier e ReturnActionCategory
│   └── validations/
│       └── financial.ts                         # Schemas Zod: createSponsorSchema, createReturnActionSchema e sponsorId em createTransactionSchema
├── types/
│   └── financial.ts                             # SponsorDTO, SponsorRoiSummaryDTO, ReturnActionDTO, atualização de TransactionDTO e DashboardMetricsDTO
├── services/
│   └── financial-service.ts                     # CRUD de Sponsor, CRUD de ReturnAction, agregação de ROI por empresa e por cota
├── actions/
│   └── financial-actions.ts                     # Server Actions para Sponsor e ReturnAction + revalidatePath("/roi") e ("/roi/acoes")
├── hooks/
│   └── use-roi-module.ts                        # Hook de domínio isolando filtros por cota, ordenação e dados dos gráficos
├── components/
│   ├── layout/
│   │   └── app-sidebar.tsx                      # Combo "ROI" com subitens: "Painel de ROI" (/roi) e "Ações de Retorno" (/roi/acoes)
│   ├── modals/
│   │   ├── create-sponsor-dialog.tsx            # Modal de cadastro/edição de Empresa Patrocinadora + Cota
│   │   ├── create-return-action-dialog.tsx      # Modal de cadastro/edição de Ação de Retorno da Equipe
│   │   ├── create-transaction-dialog.tsx        # Campo condicional de seleção de Empresa Patrocinadora
│   │   └── edit-transaction-dialog.tsx          # Campo condicional de seleção de Empresa Patrocinadora
│   └── roi/
│       ├── roi-view.tsx                         # Visão principal com KPIs, Cards por Cota, Gráficos e Tabela de Empresas
│       ├── roi-charts.tsx                       # Gráficos Recharts: Investimento vs Retorno por Empresa (BarChart) e Distribuição por Cota (PieChart/BarChart)
│       ├── sponsor-tier-badge.tsx               # Badge semântico com tailwind-variants (Bronze, Prata, Ouro, Diamante)
│       └── return-actions-view.tsx              # Página/Tabela de gestão das Ações de Retorno (/roi/acoes)
└── app/
    └── roi/
        ├── page.tsx                             # Rota /roi
        └── acoes/
            └── page.tsx                         # Rota /roi/acoes (Menu de Ações de Retorno)
```

## 7. Experiência do Usuário (UI/UX) e Design System

### 7.1 Identidade Visual das Cotas (`tailwind-variants`)
Uso estrito de tokens semânticos do Design System (zero cores hexadecimais hardcoded):
- **Bronze (`BRONZE`)**: variante `warning` suave + ícone `Medal`.
- **Prata (`SILVER`)**: variante `secondary` destacada + ícone `Award`.
- **Ouro (`GOLD`)**: variante `warning` intensa + ícone `Trophy`.
- **Diamante (`DIAMOND`)**: variante `primary` / `purple` + ícone `Gem` / `Crown`.

### 7.2 Fluxo 1: Lançar Transação com Patrocínio
- No modal `CreateTransactionDialog` / `EditTransactionDialog`:
  - Ao selecionar **Método Comprobatório = Contrato de Patrocínio**, **Setor = Marketing & Patrocínio**, ou vincular um item do orçamento de **Patrocínio / Permuta**, o bloco **"Empresa Patrocinadora (ROI)"** aparece automaticamente.
  - O usuário seleciona a empresa em um `Select` (ex.: `Bosch — Cota Diamante`).
  - Caso a empresa ainda não esteja cadastrada, há um botão inline `+ Nova empresa` para criá-la rapidamente ou através da aba ROI.

### 7.3 Fluxo 2: Aba ROI (`/roi`)
1. **Header da Página**: título *"ROI & Patrocinadores"* com botão primário **`+ Adicionar Empresa`** (`CreateSponsorDialog`).
2. **4 KPIs Principais**:
   - **Investimento Total de Patrocínios**: soma de todos os lançamentos vinculados a empresas patrocinadoras.
   - **Retorno Total Entregue**: soma de todas as ações de retorno cadastradas pela equipe.
   - **ROI Global de Patrocínios (%) & Múltiplo**: retorno líquido percentual e fator multiplicador (ex.: `2.8x`).
   - **Empresas Ativas por Cota**: contagem rápida de patrocinadores (`Diamante`, `Ouro`, `Prata`, `Bronze`).
3. **Seção de Gráficos Intuitivos (`roi-charts.tsx`)**:
   - **Gráfico 1 — Investimento vs. Retorno por Empresa (Barras Agrupadas)**: compara lado a lado o quanto cada empresa investiu (via lançamentos) e o quanto já recebeu de retorno (via ações da equipe).
   - **Gráfico 2 — Participação por Cota de Patrocínio (Rosca / Barras Horizontais)**: exibe a distribuição do volume captado e do retorno gerado entre as cotas **Bronze, Prata, Ouro e Diamante**.
4. **Vitrine / Tabela de Empresas Patrocinadoras**:
   - Filtro rápido por Cota (`Todas`, `Diamante`, `Ouro`, `Prata`, `Bronze`).
   - Cada linha/card mostra: **Empresa**, **Badge da Cota**, **Qtd. de Lançamentos**, **Investimento Acumulado (R$)**, **Qtd. de Ações**, **Retorno Gerado (R$)**, **ROI (%) + Barra de Meta** e ações de editar/excluir.

### 7.4 Fluxo 3: Menu "Ações de Retorno" (`/roi/acoes`)
1. **Header da Página**: título *"Ações de Retorno aos Patrocinadores"* com botão **`+ Registrar Ação de Retorno`** (`CreateReturnActionDialog`).
2. **Formulário da Ação**:
   - Empresa Patrocinadora beneficiada (`Select` com as empresas e suas cotas).
   - Título da Ação (ex.: *"Logo na carenagem oficial + postagem no Instagram"*).
   - Categoria da Ação (`Logo no Carro/Uniforme`, `Redes Sociais`, `Pit Display/Evento`, `Imprensa/Portfólio`, `Oficina Social`, `Outras Ativações`).
   - Data de realização.
   - Alcance / Público impactado (opcional, ex.: `12.500 impressões`).
   - Valor do Retorno Gerado em `R$` (convertido para centavos).
3. **Listagem e Filtros**:
   - Tabela com busca textual, filtro por **Empresa Patrocinadora** e filtro por **Categoria da Ação**, além de exclusão/edição com atualização imediata do ROI.

## 8. Estados de UI (Loading, Error, Empty, Success)
- **Loading**: `<Skeleton />` nos cards de KPI, gráficos e tabelas durante carregamento.
- **Empty State**:
  - Sem empresas cadastradas na aba ROI: ilustração limpa com CTA *"Cadastrar Primeira Empresa Patrocinadora"*.
  - Sem ações de retorno em `/roi/acoes`: CTA *"Registrar Primeira Ação de Retorno"*.
- **Error**: feedback claro via `StateView` com botão de retry e `toast.error` nas mutações.
- **Success**: atualização imediata via invalidação de cache do TanStack Query + `toast.success`.

## 9. Critérios de Aceite
- [ ] Na aba `/roi`, é possível cadastrar uma empresa informando nome e cota (`Bronze`, `Prata`, `Ouro`, `Diamante`).
- [ ] Ao lançar ou editar uma transação de patrocínio, o campo de seleção da **Empresa Patrocinadora** é habilitado e persistido no banco.
- [ ] O valor de **Investimento** de cada empresa na tela de ROI reflete exatamente a soma dos lançamentos vinculados a ela.
- [ ] Existe um menu separado (`/roi/acoes`) para cadastrar e listar as **Ações de Retorno** realizadas pela equipe para cada empresa.
- [ ] O valor de **Retorno** e o **% de ROI** de cada empresa são calculados automaticamente a partir das ações cadastradas.
- [ ] A tela de ROI apresenta gráficos intuitivos comparando Investimento vs. Retorno por empresa e por cota.
- [ ] Zero cores hardcoded, uso de `tailwind-variants`, componentes desacoplados seguindo SOLID e build (`npx tsc --noEmit` e `npm run build`) passando sem erros.

## 10. Plano de Execução
1. **Banco de Dados**: Atualizar `prisma/schema.prisma` (`SponsorTier`, `ReturnActionCategory`, `Sponsor`, `ReturnAction`, `Transaction.sponsorId`) e sincronizar com `npx prisma db push`.
2. **Contratos & Validações**: Atualizar `src/lib/constants.ts`, `src/types/financial.ts` e `src/lib/validations/financial.ts`.
3. **Backend Services & Server Actions**: Implementar CRUD de `Sponsor` e `ReturnAction`, vínculo em `Transaction` e agregações de ROI em `src/services/financial-service.ts` e `src/actions/financial-actions.ts`.
4. **Lançamento de Transação**: Atualizar `create-transaction-dialog.tsx` e `edit-transaction-dialog.tsx` com o seletor condicional de Empresa Patrocinadora.
5. **Menu Lateral e Página de Ações (`/roi/acoes`)**: Atualizar `app-sidebar.tsx`, criar `create-return-action-dialog.tsx`, `return-actions-view.tsx` e a rota `src/app/roi/acoes/page.tsx`.
6. **Painel de ROI e Gráficos (`/roi`)**: Criar `sponsor-tier-badge.tsx`, `create-sponsor-dialog.tsx`, `roi-charts.tsx` e refatorar `use-roi-module.ts` e `roi-view.tsx`.
7. **Verificação Final**: `npx tsc --noEmit`, `npm run build` e testes de fluxo ponta a ponta.
