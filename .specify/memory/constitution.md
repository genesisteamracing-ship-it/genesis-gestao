<!--
Sync Impact Report:
- Version Change: 1.0.0 -> 1.1.0
- Ratification Date: 2026-10-26
- Last Amended Date: 2026-11-03
- Modified Principles:
  - V. Mobile-First, Acessibilidade & Estados Completos de UI -> V. Layout Shell Padronizado (Barra Lateral Fixa), Mobile-First & Estados de UI
- Added Requirements:
  - Uso obrigatório de `<DashboardShell>` (`src/components/layout/dashboard-shell.tsx`) em todas as páginas e rotas autenticadas do sistema, garantindo `<AppSidebar />` fixa em todas as telas desktop, `<AppHeader />` no topo e `<MobileNavDrawer />` em dispositivos móveis.
- Removed Sections: None
- Follow-up TODOs: None
-->

# Genesis Gestão Constitution

## Core Principles

### I. Clean Architecture & Princípios SOLID
Todo o código do sistema deve obedecer rigorosamente à separação de responsabilidades e princípios de Clean Architecture:
- Componentes de UI têm função exclusiva de renderizar elementos visuais e emitir eventos; regras de negócio, transformações de dados e orquestração de chamadas devem ser isoladas em Custom Hooks ou utilitários puros.
- Componentes visuais não devem invocar clientes HTTP ou Prisma diretamente; a comunicação com dados ocorre via Server Actions tipadas ou Services de domínio.
- Nenhum componente de visualização deve exceder 150 linhas sem justificativa explícita de composição.
- Os princípios SOLID devem nortear cada módulo: responsabilidade única (S), extensão por composição e slots (O), conformidade de interfaces nativas (L), interfaces de props enxutas (I), e inversão de dependência através de hooks e services injetáveis (D).

### II. Design System Semântico & Zero Hardcoding
Nenhum valor arbitrário ou código de cor literal é tolerado no frontend:
- É expressamente proibido o uso de valores hexadecimais (`#fff`, `#000`), `rgb()`, `hsl()` ou classes arbitrárias do Tailwind (como `bg-[#123456]` ou `text-blue-500` sem propósito semântico).
- Toda estilização deve utilizar tokens semânticos nativos do Design System (`bg-background`, `text-foreground`, `bg-primary`, `bg-success`, `bg-warning`, `bg-purple`, `border-border`, `text-muted-foreground`, etc.).
- É prioritário o uso do ecossistema `shadcn/ui` e primitivos do Radix UI. Componentes fundamentais (modais, formulários, tabelas, gavetas, dropdowns) não devem ser recriados do zero.
- As variações de estilo devem ser obrigatoriamente construídas com `tailwind-variants` (`tv`), definindo slots para componentes compostos e extraindo variantes com `VariantProps`.

### III. Tipagem Estrita, Zod & Padrão Monetário em Centavos
A integridade dos dados e a confiabilidade dos cálculos são inegociáveis:
- O uso de `any` é estritamente proibido em todo o repositório. O TypeScript deve operar em modo estrito (`strict: true`).
- Todas as entradas de dados, requisições de formulários e Server Actions devem ser validadas por esquemas declarativos do Zod (`safeParse`).
- Todos os valores monetários (orçamentos, receitas, despesas, patrocínios e retorno de ROI) devem ser obrigatoriamente armazenados e operados em números inteiros representando centavos (`amountCents: Int`), eliminando imprecisões de ponto flutuante (IEEE 754). A formatação em Real (`R$ 0,00`) ocorre estritamente na borda de apresentação.

### IV. Testes Automatizados Obrigatórios (Test-First & Qualidade)
Nenhuma funcionalidade ou refatoração é considerada concluída sem a respectiva cobertura de testes automatizados:
- Funções matemáticas financeiras (cálculos de ROI, runway, balanço de caixa, cobertura orçamentária) e esquemas de validação do Zod devem possuir 100% de cobertura por testes unitários.
- Custom Hooks com lógica de estado complexa devem ser cobertos via testes isolados.
- Componentes e fluxos de interação devem ser testados com foco no comportamento do usuário (queries semânticas como `getByRole` e `getByLabelText`).
- Cenários de ponta a ponta (E2E) devem cobrir jornadas críticas de autenticação, lançamentos de livro caixa, controle de cotas de patrocinadores e geração de relatórios de comunicação.

### V. Layout Shell Padronizado (Barra Lateral Fixa), Mobile-First & Estados de UI
A consistência estrutural de navegação e responsividade é obrigatória e inegociável em todas as telas do sistema:
- **Uso Obrigatório do `DashboardShell` e Barra Lateral Fixa (`AppSidebar`)**: Toda página ou módulo autenticado do sistema DEVE obrigatoriamente ser envolvido pelo componente `<DashboardShell>` (`src/components/layout/dashboard-shell.tsx`). É terminantemente proibido renderizar telas internas sem a barra lateral fixa (`AppSidebar` com `sticky top-0 h-screen`), o cabeçalho global (`AppHeader`), o provedor de temporada (`SeasonProvider`) e o container padronizado (`max-w-[1600px] p-4 sm:p-6 lg:p-8`).
- **Título e Descrição Obrigatórios por Página / Aba**: Toda página, sub-rota ou aba navegável deve obrigatoriamente fornecer tanto um `title` quanto um `subtitle` contextual e explicativo no `<DashboardShell>`. Nenhuma tela deve omitir o subtítulo ou replicar estaticamente a descrição de outra aba em módulos compostos.
- **Abordagem Mobile-First**: O design deve ser projetado primeiro para telas móveis (`320px` a `639px`) e adaptado progressivamente para desktops (`md:`, `lg:`). Em telas menores que `lg`, a navegação deve ocorrer através do menu gaveta (`MobileNavDrawer` / `Sheet`) integrado ao `AppHeader`.
- **Estados Completos de UI**: Toda tela ou componente assíncrono deve contemplar e tratar com clareza quatro estados de UI: *Loading* (utilizando `<Skeleton />`), *Error* (com feedback legível e botão de retry), *Empty State* (quando não houver dados cadastrados) e *Success*.
- **Padrão de Ações em Tabelas (Menu de Engrenagem)**: Tabelas com ações por linha não devem exibir múltiplos botões soltos na célula; devem obrigatoriamente encapsular as ações em um único botão de engrenagem (`Settings`) com `<DropdownMenu>` e `<DropdownMenuContent align="end">`, idêntico ao padrão de `/lancamentos`.
- **Padrão Universal de Paginação de Tabelas (Fixa em 10 itens & 4 Controles)**: Toda tabela de dados do sistema deve utilizar obrigatoriamente `pageSize: 10` fixo, sendo proibido o uso de seletores dinâmicos de quantidade por página. O rodapé de paginação deve seguir o padrão consolidado em `/equipe` e `/lancamentos`, exibindo à esquerda o texto `Mostrando {startRow}-{endRow} de {total} [entidades]` e à direita o texto `Página {page} de {totalPages}` acompanhado do grupo de 4 botões de navegação (`ChevronsLeft`, `ChevronLeft`, `ChevronRight`, `ChevronsRight`) em container com borda suave (`border border-border bg-card shadow-2xs`).
- **Acessibilidade (a11y)**: Tags semânticas de HTML (`main`, `nav`, `section`), navegação por teclado e `aria-labels` em botões de ação ou ícones devem ser garantidas.

### VI. Multitenancy, Segurança & Trilha de Auditoria
O sistema foi concebido para suportar equipes e operações auditáveis em competições STEM:
- Todos os modelos de negócio (`Transaction`, `BudgetResource`, `Sponsor`, `ReturnAction`, `Stakeholder`, `CommunicationPlan`) devem ser vinculados e isolados por `teamId`.
- As regras de acesso baseadas em função (RBAC) devem assegurar que usuários com perfil de `AUDITOR` operem exclusivamente em modo de leitura, impedindo mutações de dados.
- Lançamentos financeiros devem exigir vínculo documental (`NFE`, `RECEIPT`, `SPONSOR_CONTRACT`, `BANK_PIX_STATEMENT`) para comprovação formal perante bancas avaliadoras de escrutínio.

## Padrões Tecnológicos & Restrições de Arquitetura

O ecossistema do Genesis Gestão é padronizado pelas seguintes tecnologias e diretrizes de infraestrutura:
- **Framework Web**: Next.js 15+ com App Router, React Server Components (RSC) e Server Actions para mutações de dados.
- **Camada de Dados & Persistência**: PostgreSQL hospedado no Neon Serverless, orquestrado via Prisma ORM com connection pooling e direct URL para migrações e sincronizações.
- **Autenticação & Sessões**: Controle de autenticação stateful via tokens JWT assinados com `jose`, armazenados em cookies `httpOnly`, com suporte a revogação de sessões e trilha de auditoria contra força bruta.
- **Estilização & Componentes**: Tailwind CSS v4 com motor Turbopack, componentes de design primitives do Radix UI via `shadcn/ui`, variações com `tailwind-variants` e ícones com `lucide-react`.
- **Visualização de Dados**: Gráficos analíticos de fluxo de caixa, evolução física-financeira e entregas de patrocínio com `Recharts`.

## Fluxo de Desenvolvimento, Quality Gates & CI/CD

Todas as alterações na base de código devem passar por validações automatizadas antes de integrar a branch principal (`main`):
- **Verificação de Tipagem Estática**: Execução do compilador TypeScript (`tsc --noEmit`) sem qualquer erro ou tipo implícito.
- **Padronização e Linting**: `eslint` configurado com regras de React e TypeScript, mantendo a árvore limpa de dead-code ou práticas inseguras.
- **Execução da Bateria de Testes**: Validação contínua com `npm test` (`tsx --test`), garantindo que todos os testes passem de forma determinística em menos de 3 segundos.
- **Pipeline de Integração Contínua (CI)**: Pipeline configurado no GitHub Actions (`.github/workflows/ci.yml`) que bloqueia pull requests ou commits que não atinjam os critérios de compilação, lint e teste.
- **Deploy Contínuo**: Sincronização automática para a plataforma de produção (Render) após aprovação do pipeline.

## Governance

A Constituição do projeto é o documento soberano que rege a arquitetura, padrões de engenharia e decisões de implementação do Genesis Gestão:
- Nenhum pull request ou entrega de funcionalidade deve ser aceito caso viole os princípios estabelecidos neste documento.
- Propostas de alteração ou expansão desta Constituição devem ser submetidas como emendas formais, justificando a necessidade e documentando o impacto em conformidade com o versionamento semântico:
  - **MAJOR**: Alterações ou remoções incompatíveis de princípios ou restrições arquiteturais fundamentais.
  - **MINOR**: Inclusão de novos princípios, padrões de design ou expansão de requisitos de qualidade.
  - **PATCH**: Ajustes redacionais, correções pontuais de texto ou refinamentos não estruturais.
- O arquivo `.specify/memory/constitution.md` deve ser mantido atualizado como fonte primária da verdade para orientar desenvolvedores e agentes autônomos de IA durante todo o ciclo de vida do projeto.

**Version**: 1.1.0 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-11-03
