Technical Specification: STEM Racing Financial & Resource ERP1. Visão Geral e ObjetivoSistema web para gestão orçamentária, alocação de recursos, cronograma físico-financeiro e fluxo de caixa para equipes da competição STEM Racing. O sistema resolve diretamente quatro critérios de auditoria:Rastreamento detalhado de despesas por categoria e método comprobatório.Gerenciamento de recursos (aquisição, alocação e % de utilização) organizado por Grupos de Entrega.Cronograma Físico-Financeiro comparando Previsto vs. Realizado.Fluxo de Caixa estruturado na linha do tempo (Origens vs. Aplicações e Saldo Acumulado).2. Tech Stack & ArquiteturaFramework: Next.js 15 (App Router, Server Components, Server Actions).Linguagem: TypeScript (Strict Mode).Banco de Dados: PostgreSQL.ORM: Prisma ORM (ou Drizzle ORM).UI / Componentes: Tailwind CSS + shadcn/ui + lucide-react + Recharts (gráficos de fluxo de caixa).Validação & Formulários: zod + react-hook-form.Padrão Monetário: Valores salvos em centavos (integer) no banco de dados para evitar erros de ponto flutuante (IEEE 754). Exemplo: R$ 150,00 = 15000.3. Modelagem de Dados (schema.prisma)Snippet de códigodatasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum DeliveryGroup {
  ENGINEERING_CAD     // Engenharia & CAD
  MANUFACTURING_CNC   // Manufatura & CNC
  PIT_DISPLAY         // Pit Display & Estande
  MARKETING_SPONSOR   // Marketing & Patrocínio
  PROJECT_MANAGEMENT  // Gestão do Projeto
}

enum AcquisitionStrategy {
  DIRECT_PURCHASE     // Compra Direta
  FINANCIAL_SPONSOR   // Patrocínio Financeiro
  BARTER_PARTNERSHIP  // Permuta / Parceria Técnica
  OWN_FUNDS_RAFFLE    // Recursos Próprios / Rifa / Evento
}

enum TransactionType {
  ORIGIN              // Origem (Entrada / Ganho / Patrocínio)
  APPLICATION         // Aplicação (Saída / Despesa)
}

enum TrackingMethod {
  NFE                 // Nota Fiscal Eletrônica
  RECEIPT             // Recibo Simples
  SPONSOR_CONTRACT    // Contrato de Patrocínio
  BANK_PIX_STATEMENT  // Comprovante PIX / Extrato Bancário
}

// 1. Categorias de Custo/Receita
model Category {
  id            String          @id @default(cuid())
  name          String          @unique // Ex: Matéria-Prima, Usinagem, Uniformes, Aporte Ouro
  deliveryGroup DeliveryGroup
  budgetItems   BudgetResource[]
  transactions  Transaction[]
  createdAt     DateTime        @default(now())
}

// 2. Planejamento de Recursos e Orçamento (PREVISTO)
model BudgetResource {
  id                  String              @id @default(cuid())
  code                String              @unique // Ex: ORC-001
  deliveryGroup       DeliveryGroup
  categoryId          String
  category            Category            @relation(fields: [categoryId], references: [id])
  resourceName        String              // Ex: Blocos de Poliuretano Oficial
  acquisitionStrategy AcquisitionStrategy
  allocatedTo         String              // Responsável (Ex: Líder de Manufatura)
  plannedMonth        Int                 // 1 a 6 (ou 1 a 12 referente ao ciclo do projeto)
  utilizationForecast Int                 // 0 a 100 (%)
  plannedAmountCents  Int                 // Valor previsto em centavos
  transactions        Transaction[]       // Transações reais atreladas a este item planejado
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt

  @@index([deliveryGroup, plannedMonth])
}

// 3. Lançamentos Financeiros e Fluxo de Caixa (REALIZADO)
model Transaction {
  id               String          @id @default(cuid())
  date             DateTime        // Data real do fato gerador
  referenceMonth   Int             // Mês na linha do tempo do projeto (1 a 6)
  type             TransactionType // ORIGIN (Ganho) ou APPLICATION (Despesa)
  deliveryGroup    DeliveryGroup
  categoryId       String
  category         Category        @relation(fields: [categoryId], references: [id])
  budgetResourceId String?         // Opcional: vincula o gasto diretamente a um item do orçamento
  budgetResource   BudgetResource? @relation(fields: [budgetResourceId], references: [id])
  description      String
  trackingMethod   TrackingMethod
  documentRef      String?         // Número da NF-e, código da transação ou link do comprovante
  amountCents      Int             // Valor realizado em centavos
  createdAt        DateTime        @default(now())

  @@index([referenceMonth, type])
  @@index([deliveryGroup, referenceMonth])
}
4. Contratos de Validação (src/lib/validations/financial.ts)TypeScriptimport { z } from "zod";

export const createBudgetResourceSchema = z.object({
  deliveryGroup: z.enum(["ENGINEERING_CAD", "MANUFACTURING_CNC", "PIT_DISPLAY", "MARKETING_SPONSOR", "PROJECT_MANAGEMENT"]),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  resourceName: z.string().min(3, "Mínimo de 3 caracteres"),
  acquisitionStrategy: z.enum(["DIRECT_PURCHASE", "FINANCIAL_SPONSOR", "BARTER_PARTNERSHIP", "OWN_FUNDS_RAFFLE"]),
  allocatedTo: z.string().min(2, "Informe o responsável"),
  plannedMonth: z.coerce.number().int().min(1).max(6),
  utilizationForecast: z.coerce.number().int().min(1).max(100),
  plannedAmountCents: z.coerce.number().int().nonnegative("O valor não pode ser negativo"),
});

export const createTransactionSchema = z.object({
  date: z.coerce.date(),
  referenceMonth: z.coerce.number().int().min(1).max(6),
  type: z.enum(["ORIGIN", "APPLICATION"]),
  deliveryGroup: z.enum(["ENGINEERING_CAD", "MANUFACTURING_CNC", "PIT_DISPLAY", "MARKETING_SPONSOR", "PROJECT_MANAGEMENT"]),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  budgetResourceId: z.string().optional().nullable(),
  description: z.string().min(3, "Descreva a transação"),
  trackingMethod: z.enum(["NFE", "RECEIPT", "SPONSOR_CONTRACT", "BANK_PIX_STATEMENT"]),
  documentRef: z.string().optional(),
  amountCents: z.coerce.number().int().positive("O valor deve ser maior que zero"),
});
5. Regras de Negócio e Cálculos (Server-Side)Toda agregação deve ocorrer no backend via queries ou funções utilitárias puras antes de chegar aos componentes:Cálculo do Fluxo de Caixa na Linha do Tempo (Mês $m \in \{1..6\}$):$\text{Origens}_m = \sum \text{Transaction.amountCents}$ onde type == ORIGIN e referenceMonth == m.$\text{Aplicações}_m = \sum \text{Transaction.amountCents}$ onde type == APPLICATION e referenceMonth == m.$\text{Saldo Líquido}_m = \text{Origens}_m - \text{Aplicações}_m$.$\text{Saldo Acumulado}_m = \text{Saldo Acumulado}_{m-1} + \text{Saldo Líquido}_m$ (com $\text{Saldo Acumulado}_0 = 0$).Cálculo do Cronograma Físico-Financeiro (Por DeliveryGroup $g$ e Mês $m$):$\text{Previsto}_{g,m} = \sum \text{BudgetResource.plannedAmountCents}$ daquele grupo e mês.$\text{Realizado}_{g,m} = \sum \text{Transaction.amountCents}$ onde type == APPLICATION daquele grupo e mês.$\text{Variação (Desvio)}_{g} = \sum_{m=1}^6 \text{Previsto}_{g,m} - \sum_{m=1}^6 \text{Realizado}_{g,m}$.Status de Alerta: Se $\text{Variação}_g < 0$, retornar badge DESTRUCTIVE ("Orçamento Estourado").Permutas (BARTER_PARTNERSHIP):Quando um recurso é adquirido via permuta no lançamento real, se a equipe quiser contabilizar no fluxo contábil sem afetar o saldo bancário, o sistema permite uma flag opcional no form "Lançar contrapartida de permuta?" que gera automaticamente 1 ORIGIN (Patrocínio In-loco) e 1 APPLICATION (Custo do Recurso) de mesmo valor.6. Arquitetura de Componentes e UI (shadcn/ui)Estrutura de Rotas (src/app/)/dashboard (Visão Geral, KPIs, Fluxo de Caixa e Cronograma Físico-Financeiro)/planejamento (Tabela de Recursos Planejados + Modal de Criação)/lancamentos (Livro Caixa Auditável + Modal de Receita/Despesa)Especificação de Telas e Componentes:Header & Ações Globais:Dois botões principais sempre visíveis no topo:<Dialog> "+ Lançar Transação (Realizado)": Abre formulário com <Tabs> rápidas para escolher 🔴 Despesa (Aplicação) ou 🟢 Receita (Origem).<Dialog> "+ Planejar Recurso (Orçamento)": Abre formulário para cadastrar item do planejamento.KPI Cards (Topo do /dashboard):4 <Card> componentes:Orçamento Total Previsto: Soma de BudgetResource.Total Arrecadado (Origens): Soma de ORIGIN.Total Gasto (Aplicações): Soma de APPLICATION.Saldo em Caixa Atual: Origens - Aplicações (Cor verde se positivo, vermelho se negativo).Visão 1: Fluxo de Caixa na Linha do Tempo (<CashFlowTimeline/>):Gráfico (Recharts): <ComposedChart> com Barras agrupadas para Origens (Verde) e Aplicações (Vermelho) mês a mês, e uma <Line> (Azul escuro) representando a evolução do Saldo Acumulado.Tabela Matricial (<Table>): Colunas de Mês 1 a Mês 6 + Total. Linhas: (+) Origens, (-) Aplicações, (=) Saldo Mensal, (=) Saldo Acumulado.Visão 2: Cronograma Físico-Financeiro (<PhysicalFinancialSchedule/>):Tabela expansiva ou agrupada por DeliveryGroup.Para cada Grupo de Entrega, renderizar duas sub-linhas lado a lado de Mês 1 a Mês 6:Linha Previsto (fundo neutro).Linha Realizado (fundo levemente destacado).Coluna final com <Progress> bar mostrando % Executado do Orçamento daquele grupo e <Badge> de status.Visão 3: Plano de Recursos e Auditoria (<DataTable> do @tanstack/react-table):Filtros no topo por DeliveryGroup, AcquisitionStrategy e TrackingMethod.Coluna de rastreio exibindo <Badge variant="outline"> para NF-e, Recibo, PIX ou Contrato.Botão de exportação (Exportar CSV / Relatório PDF) para anexar diretamente no portfólio de Gestão de Projetos da STEM Racing.7. Server Actions (src/actions/financial-actions.ts)createBudgetResourceAction(data): Valida com Zod, gera o código sequencial (ORC-XXX), insere no banco e executa revalidatePath('/dashboard').createTransactionAction(data): Valida com Zod, insere no banco (ou roda $transaction se for permuta dupla) e executa revalidatePath('/dashboard').getDashboardMetricsAction(): Executa em paralelo (Promise.all) as agregações de BudgetResource e Transaction e retorna o DTO já formatado para a matriz de 6 meses.8. Plano de Execução (Step-by-Step para implementação)Bootstrap: npx create-next-app@latest stem-erp --typescript --tailwind --eslint --app --src-dirShadcn & Deps:npx shadcn@latest initnpx shadcn@latest add button card dialog form input select table tabs badge progress sonnernpm install prisma @prisma/client zod react-hook-form @hookform/resolvers recharts lucide-reactDatabase Setup: Colar o schema.prisma acima, configurar .env e rodar npx prisma migrate dev --name init_stem_erp.Seed Inicial: Criar prisma/seed.ts com as categorias padrão da competição (Usinagem CNC, Blocos Poliuretano, Rolamentos, Estande MDF, Uniformes, Inscrição, Patrocínio Ouro/Prata).Implementar Actions & UI: Gerar as Server Actions primeiro e conectar nos componentes de <Dialog> e nas tabelas do Dashboard.