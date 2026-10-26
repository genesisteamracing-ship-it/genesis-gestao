# Technical Specification: STEM Racing ERP — Authentication, Security (`httpOnly`) & SuperAdmin Team Management

## 1. Visão Geral e Objetivos de Segurança

Módulo de autenticação, controle de sessão, gestão hierárquica de membros por **SuperAdmin** e proteção contra tentativas de invasão para o **STEM Racing Financial & Resource ERP**. O sistema resolve cinco pilares de segurança e governança:

1. **Proteção contra XSS (Cross-Site Scripting):** Token de sessão armazenado exclusivamente em **Cookie `httpOnly`**, tornando-o inacessível via JavaScript no navegador (`document.cookie` não consegue lê-lo mesmo se houver injeção de script).
2. **Proteção contra CSRF (Cross-Site Request Forgery):** Configuração `SameSite=Lax`, `Secure=true` (em produção) e validação de origem nas Server Actions do Next.js.
3. **Proteção contra Força Bruta (Brute-Force & Credential Stuffing):** Controle de tentativas falhas (`failedLoginAttempts`) com bloqueio temporário automático da conta (`lockedUntil`) após 5 tentativas consecutivas, além de mitigação de *Timing Attacks* e *User Enumeration*.
4. **Governança Centralizada pelo `SUPER_ADMIN`:** Apenas o `SUPER_ADMIN` pode cadastrar novos membros na plataforma, definir ou alterar sua **Função (`UserRole`)** e alocar sua **Equipe / Grupo de Entrega (`DeliveryGroup`)**, além de ativar/desativar contas ou desbloquear usuários travados pelo sistema anti-invasão.
5. **Isolamento Estrito de Dados por Equipe (*Team Data Isolation*):** Cada equipe (`DeliveryGroup`: Engenharia & CAD, Manufatura & CNC, Pit Display, Marketing & Patrocínio, Gestão do Projeto) **só pode visualizar e manipular as suas próprias informações**. Todas as queries e agregações no servidor aplicam filtro obrigatório `WHERE deliveryGroup = user.deliveryGroup`, exceto para o `SUPER_ADMIN` (que possui visão global de todas as equipes).
6. **Defense-in-Depth (Defesa em Profundidade):** Verificação criptográfica rápida na borda via **Next.js Middleware (`jose` HMAC-SHA256)** combinada com validação de sessão revogável no banco de dados PostgreSQL (Neon) e verificação de RBAC + escopo de equipe (`deliveryGroup`) em todas as Server Actions.

---

## 2. Tech Stack de Segurança

- **Criptografia de Token (Edge-Compatible):** `jose` (JWS assinado com algoritmo `HS256` e chave secreta `AUTH_SECRET` de 256+ bits).
- **Hashing de Senhas:** `bcryptjs` (Salt Rounds = 12) com resistência a ataques de dicionário e rainbow tables.
- **Armazenamento de Sessão:** Cookie `httpOnly` nativo via `cookies()` do `next/headers` + registro persistente na tabela `Session` do Prisma (permitindo revogação imediata de sessões quando o `SUPER_ADMIN` desativa ou altera permissões de um membro).
- **Validação & Formulários:** `zod` + `react-hook-form` + `@hookform/resolvers`.
- **UI / Componentes:** `shadcn/ui` + `@tanstack/react-table` + `lucide-react` + `sonner`, seguindo o padrão visual **DashStack** (`#4880FF` / `#202224` / `#F5F6FA`).

---

## 3. Modelagem de Dados de Autenticação e Equipe (`prisma/schema.prisma`)

```prisma
enum UserRole {
  SUPER_ADMIN       // Controle total: Finanças + Cadastro de Membros, Funções e Equipes + Segurança
  FINANCE_MANAGER   // Diretor Financeiro: Planejamento Orçamentário + Lançamentos de Caixa
  TEAM_LEAD         // Líder de Equipe/Área: Planeja e lança recursos da sua Equipe (DeliveryGroup)
  AUDITOR           // Juiz / Auditor STEM Racing: Acesso Somente Leitura e Exportação CSV/PDF
}

enum AuthEventType {
  LOGIN_SUCCESS
  LOGIN_FAILED
  ACCOUNT_LOCKED
  LOGOUT
  SESSION_REVOKED
  USER_CREATED
  USER_ROLE_UPDATED
}

// 4. Usuários / Integrantes da Plataforma
model User {
  id                  String          @id @default(cuid())
  name                String
  email               String          @unique
  passwordHash        String
  role                UserRole        @default(TEAM_LEAD)
  jobTitle            String?         // Cargo específico na equipe (Ex: Engenheiro Chefe de Aerodinâmica)
  deliveryGroup       DeliveryGroup?  // Equipe/Subgrupo atribuído (Engenharia, Manufatura, Pit Display, Marketing, Gestão)
  isActive            Boolean         @default(true)
  failedLoginAttempts Int             @default(0)
  lockedUntil         DateTime?       // Bloqueio automático anti-força bruta
  lastLoginAt         DateTime?
  createdById         String?         // ID do SUPER_ADMIN que cadastrou o integrante
  sessions            Session[]
  auditLogs           AuthAuditLog[]
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  @@index([role, deliveryGroup])
}

// 5. Sessões Ativas (Controle Stateful + Revogação Remota)
model Session {
  id           String    @id @default(cuid()) // Usado como `jti` no payload do JWT
  userId       String
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userAgent    String?
  ipAddress    String?
  expiresAt    DateTime
  revokedAt    DateTime?
  createdAt    DateTime  @default(now())

  @@index([userId, expiresAt])
}

// 6. Trilha de Auditoria de Segurança (Detecção de Tentativas de Invasão)
model AuthAuditLog {
  id           String        @id @default(cuid())
  userId       String?
  user         User?         @relation(fields: [userId], references: [id], onDelete: SetNull)
  emailAttempt String
  event        AuthEventType
  ipAddress    String?
  userAgent    String?
  details      String?
  createdAt    DateTime      @default(now())

  @@index([emailAttempt, createdAt])
  @@index([event, createdAt])
}
```

### Matriz de Permissões (RBAC) e Isolamento de Dados por Equipe

| Funcionalidade / Escopo de Dados | `SUPER_ADMIN` | `FINANCE_MANAGER` (de Equipe) | `TEAM_LEAD` / Membro | `AUDITOR` (de Equipe) |
| :--- | :---: | :---: | :---: | :---: |
| **Escopo de Visualização (`DeliveryGroup`)** | 🌐 **Todas as Equipes** (Visão Global) | 🔒 **Apenas sua própria Equipe** | 🔒 **Apenas sua própria Equipe** | 🔒 **Apenas sua própria Equipe** (ou Global se sem equipe fixa) |
| Visualizar KPIs, Fluxo de Caixa e Cronograma da sua Equipe | ✅ (Todas) | ✅ (Só da sua equipe) | ✅ (Só da sua equipe) | ✅ (Só da sua equipe) |
| Criar Recursos e Lançamentos Financeiros | ✅ (Em qualquer equipe) | ✅ (Travado na sua equipe) | ✅ (Travado na sua equipe) | ❌ (Somente Leitura) |
| Acessar `/equipe` (Gestão de Equipe & Segurança) | ✅ | ❌ | ❌ | ❌ |
| Cadastrar Novos Usuários e Atribuir Função / Equipe (`DeliveryGroup`) | ✅ | ❌ | ❌ | ❌ |
| Alterar Função/Equipe, Desbloquear Conta ou Revogar Sessões | ✅ | ❌ | ❌ | ❌ |

#### Regra Server-Side de Isolamento (`resolveTeamScope(user)`):
- Se `user.role === "SUPER_ADMIN"`: escopo irrestrito (`deliveryGroupFilter = undefined`), visualizando e gerenciando todas as 5 equipes.
- Para qualquer outro usuário com `user.deliveryGroup` definido:
  1. **Leitura (`getDashboardMetricsService`)**: filtra `Category`, `BudgetResource` e `Transaction` no banco de dados com `where: { deliveryGroup: user.deliveryGroup }`, e calcula os KPIs, o Fluxo de Caixa e o Cronograma Físico-Financeiro **exclusivamente** para a equipe do usuário logado.
  2. **Escrita (`createBudgetResourceAction` e `createTransactionAction`)**: ignora ou bloqueia qualquer tentativa de enviar um `deliveryGroup` diferente de `user.deliveryGroup` (`if (data.deliveryGroup !== user.deliveryGroup) throw ForbiddenError`), garantindo no servidor que uma equipe jamais insira ou altere gastos em outra equipe.

---

## 4. Especificação do Cookie `httpOnly` (`src/lib/auth-cookies.ts`)

O cookie de sessão será denominado `stem_erp_session` e configurado com os seguintes atributos de segurança:

| Atributo | Valor | Justificativa de Segurança |
| :--- | :--- | :--- |
| `name` | `"stem_erp_session"` | Identificador dedicado da sessão do ERP. |
| `httpOnly` | `true` | **Obrigatório.** Bloqueia qualquer acesso via `document.cookie`, protegendo contra roubo de sessão via XSS. |
| `secure` | `process.env.NODE_ENV === "production"` | Garante que o cookie só trafegue sob conexões criptografadas TLS/HTTPS em produção (Render). |
| `sameSite` | `"lax"` | Impede o envio do cookie em requisições cross-site forjadas (proteção contra CSRF). |
| `path` | `"/"` | Disponível para todas as rotas e Server Actions da aplicação. |
| `maxAge` | `28800` (8 horas) | Janela de sessão limitada ao turno de trabalho, reduzindo exposição. |

### Estrutura do Payload JWT (Assinado com `HS256`):
```typescript
export interface SessionTokenPayload {
  sub: string;                        // ID do Usuário (User.id)
  jti: string;                        // ID único da Sessão no banco (Session.id)
  name: string;                       // Nome do integrante
  email: string;                      // E-mail corporativo
  role: UserRole;                     // SUPER_ADMIN | FINANCE_MANAGER | TEAM_LEAD | AUDITOR
  deliveryGroup: DeliveryGroup | null;// Equipe vinculada (Ex: MANUFACTURING_CNC)
  jobTitle: string | null;            // Cargo descritivo (Ex: Líder de Manufatura)
  iat: number;                        // Issued At
  exp: number;                        // Expiration Timestamp
}
```

---

## 5. Contratos de Validação (`src/lib/validations/auth.ts`)

```typescript
import { z } from "zod";
import { deliveryGroupValues } from "./financial";

export const userRoleValues = [
  "SUPER_ADMIN",
  "FINANCE_MANAGER",
  "TEAM_LEAD",
  "AUDITOR",
] as const;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um e-mail válido"),
  password: z
    .string()
    .min(1, "Informe sua senha de acesso")
    .max(128, "Senha excede o limite permitido"),
});

export const createMemberSchema = z.object({
  name: z.string().trim().min(3, "O nome deve ter no mínimo 3 caracteres"),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido"),
  password: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "Deve conter ao menos uma letra maiúscula")
    .regex(/[a-z]/, "Deve conter ao menos uma letra minúscula")
    .regex(/[0-9]/, "Deve conter ao menos um número"),
  role: z.enum(userRoleValues, {
    required_error: "Selecione a função de acesso na plataforma",
  }),
  deliveryGroup: z.enum(deliveryGroupValues).nullable().optional(),
  jobTitle: z.string().trim().min(2, "Informe o cargo/função na equipe"),
});

export const updateMemberAccessSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(userRoleValues),
  deliveryGroup: z.enum(deliveryGroupValues).nullable(),
  jobTitle: z.string().trim().min(2, "Informe o cargo na equipe"),
  isActive: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberAccessInput = z.infer<typeof updateMemberAccessSchema>;
```

---

## 6. Regras de Negócio: Anti-Invasão e Gestão de Equipe pelo SuperAdmin

### 6.1. Usuário `SUPER_ADMIN` Inicial (Seed)
O script `prisma/seed.ts` garante a existência do `SUPER_ADMIN` mestre da plataforma (e de contas de teste por perfil):
- **SuperAdmin:** `superadmin@genesisracing.com` | Senha: `Genesis@2026` | Função: `SUPER_ADMIN` | Cargo: `Team Principal & SuperAdmin` | Equipe: `PROJECT_MANAGEMENT`.

### 6.2. Proteção Anti-Invasão no Login (`loginAction`)
1. **Mitigação de Timing Attack & User Enumeration:** Quando o e-mail informado não existe, o servidor executa um `bcrypt.compare` contra um hash *dummy* de custo 12 para igualar o tempo de resposta e retorna mensagem genérica `"Credenciais inválidas"`.
2. **Bloqueio Automático por Força Bruta (`Account Lockout`):**
   - Cada senha incorreta incrementa `failedLoginAttempts`.
   - Ao atingir **5 tentativas falhas consecutivas**, a conta recebe `lockedUntil = now + 15 minutos` e um alerta `ACCOUNT_LOCKED` é gravado em `AuthAuditLog`.
   - Enquanto `lockedUntil > now` (ou `isActive == false`), qualquer tentativa de login é bloqueada imediatamente.
3. **Sessão `httpOnly` + Registro Stateful:** No login bem-sucedido, zera `failedLoginAttempts`, cria a linha em `Session`, assina o JWT (`HS256`) com `jti = session.id` e define o cookie `stem_erp_session` com `httpOnly: true`.

### 6.3. Gestão de Usuários, Funções e Equipes pelo `SUPER_ADMIN`
Apenas usuários autenticados com `role === "SUPER_ADMIN"` (validados no servidor via `requireSuperAdmin()`) podem executar:
1. **`createTeamMemberAction(data)`:**
   - Verifica se o chamador é `SUPER_ADMIN`.
   - Verifica unicidade do `email`.
   - Gera o hash da senha com `bcrypt.hash(password, 12)`.
   - Cria o usuário com `role`, `deliveryGroup` (Equipe/Área) e `jobTitle`, registrando `createdById = superAdmin.id` e evento `USER_CREATED` em `AuthAuditLog`.
2. **`updateTeamMemberAccessAction(data)`:**
   - Permite ao `SUPER_ADMIN` alterar a função (`role`), a equipe atribuída (`deliveryGroup`), o cargo (`jobTitle`) ou o status (`isActive`) de qualquer membro.
   - **Segurança Ativa:** Se o membro tiver sua função rebaixada ou for desativado (`isActive: false`), todas as sessões ativas dele na tabela `Session` são imediatamente revogadas (`revokedAt = new Date()`), forçando novo login ou bloqueando o acesso instantaneamente.
   - Impede que o último `SUPER_ADMIN` ativo desative ou rebaixe a própria conta (prevenção de *lockout* administrativo).
3. **`unlockUserAccountAction(userId)`:**
   - Permite ao `SUPER_ADMIN` destravar manualmente (`failedLoginAttempts = 0`, `lockedUntil = null`) um membro cuja conta foi bloqueada por tentativas de invasão/erro de senha.

---

## 7. Arquitetura de Componentes e Telas (`shadcn/ui` — Padrão DashStack)

### Estrutura de Rotas Atualizada (`src/app/`)
- `/login`: Tela de autenticação blindada com cookie `httpOnly`, indicador de segurança e atalhos de preenchimento rápido em ambiente de demonstração.
- `/dashboard`: Visão Geral, KPIs, Fluxo de Caixa e Cronograma Físico-Financeiro.
- `/planejamento`: Plano de Recursos e Orçamento.
- `/lancamentos`: Livro Caixa Auditável.
- `/equipe` **(NOVO — Exclusivo `SUPER_ADMIN`)**: Painel de Gestão de Equipe, Atribuição de Funções/Subgrupos e Auditoria de Tentativas de Invasão (`AuthAuditLog`).

### Especificação da Tela `/equipe` (Painel do SuperAdmin)
1. **KPIs de Governança & Segurança (Topo):**
   - **Total de Integrantes:** Membros cadastrados e ativos na equipe.
   - **Equipes / Grupos Cobertos:** Distribuição por `DeliveryGroup` (Engenharia, Manufatura, Pit Display, Marketing, Gestão).
   - **Sessões Ativas (`httpOnly`):** Quantidade de sessões válidas no momento.
   - **Tentativas de Invasão Bloqueadas:** Total de eventos `LOGIN_FAILED` e `ACCOUNT_LOCKED` registrados no `AuthAuditLog`.
2. **Modal `<CreateMemberDialog />` (`"+ Cadastrar Integrante"`):**
   - Formulário com `shadcn/ui` (`Dialog`, `Form`, `Input`, `Select`) validado com `react-hook-form` + `zodResolver`.
   - Campos: Nome Completo, E-mail Corporativo, Senha Inicial Forte, **Função de Acesso (`UserRole`)**, **Equipe / Grupo de Entrega (`DeliveryGroup`)** e Cargo Específico (`jobTitle`, ex: "Engenheiro de Manufatura CNC").
3. **Tabela de Membros (`<TeamMembersDataTable />` no padrão `tabela.png`):**
   - Barra de filtros segmentada: `[ Ícone Funil | Filtrar Por | Função (Role) | Equipe (DeliveryGroup) | Status da Conta | ↺ Resetar Filtro ]`.
   - Colunas: `ID`, `INTEGRANTE & E-MAIL`, `CARGO & EQUIPE (DELIVERY GROUP)`, `FUNÇÃO (RBAC)`, `ÚLTIMO ACESSO / SEGURANÇA`, `STATUS` (Ativo / Bloqueado / Inativo) e `AÇÕES DO SUPERADMIN` (Editar Função/Equipe, Desbloquear Conta, Ativar/Desativar).
   - Paginação idêntica à referência (`Mostrando 1-09 de X` com botões `< | >`).
4. **Tabela de Auditoria Anti-Invasão (`<SecurityAuditTable />`):**
   - Exibe os eventos recentes de `AuthAuditLog` (`LOGIN_SUCCESS`, `LOGIN_FAILED`, `ACCOUNT_LOCKED`, `USER_CREATED`, `USER_ROLE_UPDATED`) com data/hora, e-mail alvo, IP e detalhes.
