# Technical Specification: STEM Racing ERP — Multi-Tenant Teams, Authentication (`httpOnly`) & SuperAdmin Governance

## 1. Visão Geral e Arquitetura Multi-Equipe (Multi-Tenant)

Módulo de autenticação com **Cookie `httpOnly`**, proteção anti-invasão e isolamento multi-equipe para o **STEM Racing Financial & Resource ERP**.

### Conceito Central: Equipes (`Team`) vs. Setores (`DeliveryGroup`)
1. **Equipes da Competição (`model Team` — Ex: "Equipe Gênesis", "Equipe Alpha"):**
   - A plataforma é **Multi-Tenant por Equipe**.
   - **Cada Equipe só pode visualizar e gerenciar as suas próprias informações** (`BudgetResource`, `Transaction`, `Category`, KPIs, Fluxo de Caixa e Cronograma Físico-Financeiro).
   - Os integrantes da **Equipe Gênesis** jamais veem os dados da **Equipe Alpha**, e vice-versa (`WHERE teamId = user.teamId`).
2. **Setores Internos da Equipe (`enum DeliveryGroup`):**
   - Dentro de uma mesma equipe (ex: **Equipe Gênesis**), existem os 5 setores/grupos de entrega (`Engenharia & CAD`, `Manufatura & CNC`, `Pit Display & Estande`, `Marketing & Patrocínio`, `Gestão do Projeto`).
   - Todos os integrantes da **Equipe Gênesis** visualizam todos os 5 setores da própria **Equipe Gênesis** e podem planejar recursos ou lançar transações nos setores da sua equipe.
3. **Governança do `SUPER_ADMIN`:**
   - O `SUPER_ADMIN` é o administrador global da plataforma.
   - Ele pode **criar novas Equipes** (ex: Equipe Gênesis, Equipe Alpha, Equipe Beta), **cadastrar integrantes**, atribuir a qual **Equipe (`teamId`)** cada pessoa pertence, definir seu **Setor/Função (`deliveryGroup` + `role` + `jobTitle`)**, e alternar entre a visualização de qualquer Equipe na plataforma.

---

## 2. Modelagem de Dados (`prisma/schema.prisma`)

```prisma
// 0. Equipes da Competição (Multi-Tenant: Equipe Gênesis, Equipe Alpha, etc.)
model Team {
  id              String           @id @default(cuid())
  name            String           @unique // Ex: Equipe Gênesis, Equipe Alpha
  slug            String           @unique // Ex: equipe-genesis, equipe-alpha
  schoolOrOrg     String?          // Ex: SENAI / Escuderia Gênesis
  isActive        Boolean          @default(true)
  users           User[]
  categories      Category[]
  budgetResources BudgetResource[]
  transactions    Transaction[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

// 1. Categorias de Custo/Receita (Por Equipe e Setor)
model Category {
  id            String           @id @default(cuid())
  teamId        String
  team          Team             @relation(fields: [teamId], references: [id], onDelete: Cascade)
  name          String
  deliveryGroup DeliveryGroup    // Setor interno da equipe
  budgetItems   BudgetResource[]
  transactions  Transaction[]
  createdAt     DateTime         @default(now())

  @@unique([teamId, name])
}

// 2. Planejamento de Recursos e Orçamento (Por Equipe)
model BudgetResource {
  id                  String              @id @default(cuid())
  teamId              String
  team                Team                @relation(fields: [teamId], references: [id], onDelete: Cascade)
  code                String              // Ex: ORC-001 (único dentro da Equipe)
  deliveryGroup       DeliveryGroup       // Setor: Engenharia, Manufatura, Pit Display, Marketing, Gestão
  categoryId          String
  category            Category            @relation(fields: [categoryId], references: [id])
  resourceName        String
  acquisitionStrategy AcquisitionStrategy
  allocatedTo         String
  plannedMonth        Int
  utilizationForecast Int
  plannedAmountCents  Int
  transactions        Transaction[]
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt

  @@unique([teamId, code])
  @@index([teamId, deliveryGroup, plannedMonth])
}

// 3. Lançamentos Financeiros e Fluxo de Caixa (Por Equipe)
model Transaction {
  id               String          @id @default(cuid())
  teamId           String
  team             Team            @relation(fields: [teamId], references: [id], onDelete: Cascade)
  date             DateTime
  referenceMonth   Int
  type             TransactionType
  deliveryGroup    DeliveryGroup
  categoryId       String
  category         Category        @relation(fields: [categoryId], references: [id])
  budgetResourceId String?
  budgetResource   BudgetResource? @relation(fields: [budgetResourceId], references: [id])
  description      String
  trackingMethod   TrackingMethod
  documentRef      String?
  amountCents      Int
  createdAt        DateTime        @default(now())

  @@index([teamId, referenceMonth, type])
  @@index([teamId, deliveryGroup, referenceMonth])
}

// 4. Usuários / Integrantes
model User {
  id                  String          @id @default(cuid())
  name                String
  email               String          @unique
  passwordHash        String
  role                UserRole        @default(TEAM_LEAD)
  teamId              String?         // Equipe à qual pertence (Ex: Equipe Gênesis ou Equipe Alpha)
  team                Team?           @relation(fields: [teamId], references: [id], onDelete: SetNull)
  deliveryGroup       DeliveryGroup?  // Setor principal do integrante dentro da equipe
  jobTitle            String?         // Cargo descritivo (Ex: Líder de Manufatura)
  isActive            Boolean         @default(true)
  failedLoginAttempts Int             @default(0)
  lockedUntil         DateTime?
  lastLoginAt         DateTime?
  createdById         String?
  sessions            Session[]
  auditLogs           AuthAuditLog[]
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  @@index([teamId, role])
}
```

---

## 3. Segurança do Cookie `httpOnly` e Anti-Invasão

1. **Cookie `stem_erp_session` (`httpOnly: true`, `sameSite: "lax"`, `secure: true` em produção):**
   - Impede roubo de sessão via ataques XSS (`document.cookie` bloqueado).
   - O payload JWT assinado (`HS256` via `jose`) armazena `sub` (`userId`), `jti` (`sessionId`), `role`, `teamId` e `teamName`.
2. **Proteção Anti-Força Bruta (`Account Lockout`):**
   - Após **5 tentativas de senha inválidas**, a conta é bloqueada por **15 minutos** (`lockedUntil`) e o evento `ACCOUNT_LOCKED` é registrado em `AuthAuditLog`.
3. **Isolamento Multi-Tenant no Servidor (`resolveActiveTeamId`):**
   - **Integrante de Equipe (`user.role !== "SUPER_ADMIN"`):** O backend força obrigatoriamente `teamId = user.teamId` em todas as leituras (`getDashboardMetricsService`) e escritas (`createBudgetResourceAction`, `createTransactionAction`). Todos os 5 setores (`Engenharia`, `Manufatura`, `Pit Display`, `Marketing`, `Gestão`) daquela equipe ficam visíveis para seus membros, mas os dados de outras equipes (ex: Equipe Alpha vs. Equipe Gênesis) são 100% isolados.
   - **SuperAdmin (`user.role === "SUPER_ADMIN"`):** Pode selecionar no cabeçalho qual equipe deseja inspecionar/operar (ex: **Equipe Gênesis** ou **Equipe Alpha**) através do seletor de contexto de equipe (`stem_erp_active_team`), além de gerenciar todas as equipes e usuários em `/equipe`.
