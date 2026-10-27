# Spec: Refatoração Mobile-First & Responsividade com Tailwind CSS

## 1. Contexto e Diagnóstico dos Problemas Atuais no Mobile

O **STEM Racing ERP** foi construído com base em dashboards densos inspirados no padrão DashStack, priorizando layouts para telas desktop (`lg:` / `xl:`). Uma auditoria técnica realizada nos componentes de layout, tabelas, dashboards e modais revelou as seguintes fragilidades críticas em dispositivos móveis (smartphones com largura entre `320px` e `639px`):

### 1.1 Navegação Mobile Deficiente e Incompleta
- **Sidebar Desktop Oculta (`hidden lg:flex`):** O menu lateral principal (`AppSidebar`) fica totalmente invisível em telas menores que 1024px.
- **Barra Horizontal Secundária Improvisada:** Para contornar a ausência da sidebar, o `AppHeader` inseriu uma barra horizontal secundária no mobile (`border-t border-border px-4 py-2 lg:hidden`). Em telas de `320px` a `420px`, essa barra quebra em 2 a 3 linhas desajeitadas, consumindo até 120px de altura útil da tela e empurrando o conteúdo para baixo.
- **Sub-rotas Omitidas no Mobile:** O menu horizontal mobile possui links estáticos apenas para `/dashboard`, `/planejamento`, `/lancamentos`, `/roi` e `/equipe`. Rotas secundárias essenciais, como **Ações de Retorno (`/roi/acoes`)**, não constam no mobile, tornando impossível para o usuário acessá-las pelo celular sem digitar a URL manualmente.
- **Falta de Menu Gaveta (Drawer / Sheet):** Não existe um menu hambúrguer com gaveta lateral deslizante (`Sheet`), que é o padrão ouro da indústria para aplicações SPA ricas em dispositivos móveis.

### 1.2 Header Comprimido e Quebra de Layout
- O `AppHeader` reúne na mesma linha o logotipo, o seletor de equipe ativa (com dropdown largo ou badge) e a área de perfil/tema. Em larguras estreitas (`320px` a `375px`), esses elementos competem pelo espaço horizontal, provocando quebra involuntária de linha (`flex-wrap`) ou achatamento dos seletores.

### 1.3 Barras de Filtros em Linha e Quebras Visuais nas Tabelas
- As tabelas principais (`ResourcesDataTable`, `TransactionsDataTable`, `TeamMembersDataTable`, `ReturnActionsView`) utilizam uma barra de filtros segmentada em uma única linha com divisórias verticais fixas (`border-r border-border`).
- No mobile, essa barra tenta quebrar com `flex-wrap`, mas os itens ficam desalinhados, os seletores com tamanhos desiguais, as bordas direitas aparecem no meio das linhas e o botão "Resetar Filtro" fica isolado ou cortado.
- Os botões de ação do topo ("Buscar...", "Exportar CSV" e "Relatório PDF") usam larguras rígidas (`shrink-0`), estourando a largura da tela em celulares pequenos.

### 1.4 Modais sem Margem Segura e com Altura Inadequada (`DialogContent`)
- O componente base `DialogContent` utiliza `p-6`, `max-w-xl` e `max-h-[90vh]`.
- No mobile (especialmente iOS Safari e Chrome Android), a unidade `vh` não considera a barra de endereço dinâmica do navegador, fazendo com que o rodapé do modal ou os botões de ação fiquem escondidos sob a barra de ferramentas do sistema operacional. O correto é adotar `max-h-[90dvh]` e margem segura `w-[calc(100vw-2rem)] sm:max-w-lg`.
- Além disso, modais densos (ex.: `CreateTransactionDialog`, `CreateBudgetResourceDialog`) utilizam grids de 2 e 3 colunas que em algumas resoluções intermediárias espremem inputs e labels.

### 1.5 Tabelas Matriciais e Gráficos Densos
- **Linha do Tempo do Fluxo de Caixa (`CashFlowTimeline`)** e **Cronograma Físico-Financeiro (`PhysicalFinancialSchedule`)**: as tabelas matriciais exibem colunas dinâmicas para todos os meses da temporada (podendo chegar a 12 ou 24 meses). Em telas mobile, sem um container com scroll horizontal suave (`overflow-x-auto`) e sombra de indicação visual, as tabelas quebram ou exigem esforço do usuário sem pistas visuais de que há dados laterais.
- A legenda do gráfico de fluxo de caixa fica alinhada no header do card e estoura no mobile.

### 1.6 Espaçamento Global Rígido e Títulos Excessivos
- O container principal em `DashboardShell` utiliza `p-6 lg:p-8`, subtraindo 48px de largura da tela do celular (`p-6` em ambos os lados). Em uma tela de `360px`, sobram apenas `312px` úteis para conteúdo.
- Os títulos de páginas usam classe estática `text-[28px] font-bold`, que no mobile quebra em múltiplas linhas e polui a primeira dobra da tela.

---

## 2. Objetivos e Princípios Mobile-First

1. **Abordagem Mobile-First Estrita:** Todo estilo base do Tailwind CSS deve ser concebido para telas pequenas (`320px` a `639px`) sem prefixo, adicionando breakpoints progressivos (`sm:`, `md:`, `lg:`, `xl:`) exclusivamente para expandir a interface em telas maiores.
2. **Navegação Móvel Completa e Confortável:**
   - Implementar o componente `Sheet` (Gaveta deslizante via Radix Dialog + `tailwind-variants`).
   - Criar o `MobileNavDrawer` acessível via botão hambúrguer no `AppHeader` em telas `< lg`.
   - Incluir no menu mobile a mesma estrutura hierárquica do desktop (Finanças com sub-itens, ROI com sub-itens e Equipe).
   - Eliminar a barra horizontal secundária estática do `AppHeader`.
3. **Prevenção de Quebra e Overflow Horizontal:**
   - Adicionar `min-w-0` em todos os nós filhos de containers `flex` e `grid`.
   - Garantir que tabelas e gráficos tenham wrappers com `overflow-x-auto` e classes utilitárias para rolagem fluida (`-webkit-overflow-scrolling: touch`).
   - Botões de filtro e ações com comportamento `w-full sm:w-auto`.
4. **Modais e Formulários 100% Responsivos:**
   - `DialogContent` configurado com `w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto sm:max-w-lg p-4 sm:p-6`.
   - `DialogFooter` empilhado no mobile (`flex-col-reverse sm:flex-row gap-2`) para que a ação primária fique facilmente alcançável pelo polegar.
   - Grids de formulário estritamente empilhados em `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
5. **Touch Targets e Espaçamento Confortável:**
   - Área mínima de toque de `44x44px` para elementos interativos no mobile.
   - Espaçamento de página adaptativo: `p-4 sm:p-6 lg:p-8`.
   - Tipografia responsiva: `text-xl sm:text-2xl lg:text-[28px]` para títulos de tela.

---

## 3. Fora de Escopo

- Redesenhar a lógica de negócios, cálculos de fluxo de caixa, Prisma schema ou services backend.
- Criação de aplicativo nativo (React Native / Flutter) ou empacotamento PWA com service workers offline.
- Remoção da visão em tabela desktop — a responsividade deve preservar 100% da riqueza analítica já existente.

---

## 4. Regras de Interface & UX Mobile-First

| # | Regra | Detalhamento |
|---|-------|--------------|
| **RN-M1** | **Base Mobile-First** | Nenhuma classe CSS desktop deve ser aplicada sem breakpoint (`lg:` ou `md:`). A classe padrão sem prefixo deve atender perfeitamente uma tela de `320px`. |
| **RN-M2** | **Gaveta Lateral (`Sheet`)** | O `AppHeader` deve exibir um botão hambúrguer visível apenas em telas `< lg` (`flex lg:hidden`). Ao clicar, abre um `Sheet` lateral deslizante da esquerda com a navegação integral, botão de fechar, alternador de tema e dados do usuário. |
| **RN-M3** | **Remoção da Barra Subheader Mobile** | A barra secundária com links horizontais truncados no `AppHeader` deve ser completamente removida, limpando a área útil vertical da tela. |
| **RN-M4** | **Header Adaptativo** | Em telas `< sm`, o `AppHeader` deve ocultar textos secundários do usuário e exibir apenas avatar e seletor compacto da equipe, mantendo tudo alinhado em uma única linha de 60px a 70px de altura. |
| **RN-M5** | **Filtros Responsivos em Tabelas** | As barras de filtro não devem usar divisórias rígidas `border-r` no mobile. Devem utilizar layout em grid (`grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center`), com botões de reset e busca ocupando `w-full sm:w-auto`. |
| **RN-M6** | **Tabelas com Scroll Seguro** | Todo `<Table />` denso deve estar contido em `<div className="relative w-full overflow-x-auto rounded-xl border border-border">` com indicador sutil de rolagem horizontal se houver overflow. |
| **RN-M7** | **Modais Adaptados a Viewport Dinâmica** | `DialogContent` deve ter largura `w-[calc(100vw-2rem)] sm:w-full sm:max-w-lg`, padding `p-4 sm:p-6` e altura máxima `max-h-[90dvh] overflow-y-auto`. |
| **RN-M8** | **Botões de Ação no Mobile** | Grupos de botões em `headerAction` (ex.: "+ Planejar Recurso", "+ Lançar Transação") devem ter `w-full sm:w-auto` e empilhar verticalmente em telas `< sm`. |
| **RN-M9** | **Cards de KPI e Grid de Métricas** | Indicadores e KPI cards devem usar `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6`, garantindo leitura limpa em celulares sem cortar números monetários. |

---

## 5. Arquitetura e Lista de Arquivos a Criar/Refatorar

### 5.1 Novos Componentes a Criar

1. **`src/components/ui/sheet.tsx`**:
   - Primitivo shadcn/ui baseado em `@radix-ui/react-dialog`.
   - Variações criadas via `tv()` (`tailwind-variants`) com suporte a slots (`overlay`, `content`, `header`, `footer`, `title`, `description`) e variantes de lado (`side: "top" | "bottom" | "left" | "right"`).
   - Animações fluidas de slide-in e fade-in para mobile.

2. **`src/components/layout/mobile-nav-drawer.tsx`**:
   - Componente que encapsula o `Sheet` para a navegação mobile.
   - Recebe `currentUser` e fecha automaticamente ao clicar em um link ou navegar.
   - Reutiliza a lógica de grupos colapsáveis de **Finanças** e **ROI & Patrocínio** e link de **Equipes**.

### 5.2 Componentes e Páginas a Refatorar

1. **`src/components/layout/app-header.tsx`**:
   - Inserir botão de menu hambúrguer (`<Menu className="h-5 w-5" />`) que aciona o `MobileNavDrawer`.
   - Eliminar a barra horizontal redundante de navegação no rodapé do header (`lg:hidden`).
   - Tornar o seletor de equipe e área de usuário compactos em telas móveis (`hidden sm:block` em textos auxiliares).

2. **`src/components/layout/dashboard-shell.tsx`**:
   - Ajustar padding principal para `p-4 sm:p-6 lg:p-8`.
   - Título responsivo: `text-xl sm:text-2xl lg:text-[28px]`.
   - Container de cabeçalho da página: `flex-col sm:flex-row items-stretch sm:items-center gap-3`.

3. **`src/components/ui/dialog.tsx`**:
   - Atualizar `DialogContent` para `w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto p-4 sm:p-6 sm:max-w-lg`.
   - Atualizar `DialogFooter` para `flex flex-col-reverse sm:flex-row gap-2 sm:justify-end`.

4. **`src/components/tables/resources-data-table.tsx`**:
   - Barra de busca e exportação: botões com `w-full sm:w-auto` e flex wrap harmonioso.
   - Barra de filtros: migrar de linha segmentada rígida para grid responsivo (`grid grid-cols-1 sm:grid-cols-2 lg:flex`).
   - Wrapper da tabela: garantir `w-full overflow-x-auto` sem corte de conteúdo.
   - Paginação: botões e textos ajustados para não quebrar em telas estreitas.

5. **`src/components/tables/transactions-data-table.tsx`**:
   - Mesma padronização da barra de busca e exportação.
   - Barra de filtros segmentada migrada para layout responsivo.
   - Tabela com `overflow-x-auto` e células com formatação segura de data e valor.

6. **`src/components/tables/team-members-data-table.tsx`**:
   - Barra de filtros segmentada (Equipe, Setor, Permissão, Status, Reset) ajustada para `grid grid-cols-1 sm:grid-cols-2 lg:flex`.
   - Botões de ação do SuperAdmin adaptados para touch.

7. **`src/components/dashboard/cash-flow-timeline.tsx`**:
   - CardHeader com padding `p-4 sm:p-6 lg:p-7`.
   - Legenda de cores adaptativa (empilhada ou em flex-wrap no mobile).
   - Gráfico com altura responsiva (`h-64 sm:h-80`) e margens ajustadas no Recharts.
   - Tabela matricial de fluxo com wrapper `overflow-x-auto` protegido.

8. **`src/components/dashboard/physical-financial-schedule.tsx`**:
   - CardHeader e CardContent com paddings fluidos `p-4 sm:p-6 lg:p-7`.
   - Tabela de comparação mensal com rolagem lateral fluida e colunas fixas protegidas por `min-w-[140px]`.

9. **`src/components/dashboard/kpi-cards.tsx`**:
   - Padding interno dos cards ajustado para `p-4 sm:p-6`.
   - Tipografia dos valores monetários adaptativa: `text-2xl sm:text-[26px]`.

10. **`src/components/roi/roi-view.tsx` & `src/components/roi/return-actions-view.tsx`**:
    - Ajuste dos botões de "+ Nova Empresa", "+ Registrar Ação" e simulador para empilhar em telas pequenas.
    - Grid de cotas de patrocinadores (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`).
    - Tabelas de empresas e ações com rolagem horizontal tratada.

11. **Modais (`src/components/modals/*`)**:
    - `create-transaction-dialog.tsx`: Abas de Despesa/Receita com toque confortável, campos em `grid-cols-1 sm:grid-cols-2`.
    - `create-budget-resource-dialog.tsx`: Campos em coluna única no mobile e 2 colunas a partir de `sm:`.
    - `create-sponsor-dialog.tsx`, `create-return-action-dialog.tsx`, `create-team-dialog.tsx`, `create-member-dialog.tsx`, `edit-member-dialog.tsx`: Rodapés com botões esticados no mobile (`w-full sm:w-auto`).

12. **`src/app/login/page.tsx` & `src/components/auth/login-form.tsx`**:
    - Padding da tela de login ajustado para `p-3 sm:p-6`.
    - Card com `p-5 sm:p-8`.

---

## 6. Design System & Componentes (`tailwind-variants`)

### 6.1 `Sheet` (`src/components/ui/sheet.tsx`)
```ts
import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { tv, type VariantProps } from "tailwind-variants";
import { X } from "lucide-react";

export const sheetVariants = tv({
  slots: {
    overlay:
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
    content:
      "fixed z-50 gap-4 bg-card p-6 shadow-2xl transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:duration-300",
    header: "flex flex-col space-y-2 text-left",
    footer: "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
    title: "text-lg font-bold text-foreground",
    description: "text-sm text-muted-foreground",
  },
  variants: {
    side: {
      top: { content: "inset-x-0 top-0 border-b border-border data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top" },
      bottom: { content: "inset-x-0 bottom-0 border-t border-border data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom" },
      left: { content: "inset-y-0 left-0 h-full w-3/4 max-w-xs border-r border-border data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left" },
      right: { content: "inset-y-0 right-0 h-full w-3/4 max-w-xs border-l border-border data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right" },
    },
  },
  defaultVariants: {
    side: "left",
  },
});
```

### 6.2 Botões de Ação Responsivos em Tabelas e Formulários
```tsx
// Padrão de container para ações em tabelas e cabeçalhos de tela
<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
  <Button className="w-full sm:w-auto">...</Button>
</div>
```

---

## 7. Critérios de Aceite

- [ ] **Navegação Móvel Integral:** Em telas com largura `< 1024px`, o botão hambúrguer é visível no topo esquerdo do `AppHeader` e abre a gaveta lateral (`Sheet`).
- [ ] **Acesso a Todos os Módulos:** O menu mobile permite navegar em Finanças (Dashboard, Planejamento, Livro Caixa), ROI (Visão Geral, Ações de Retorno) e Equipes sem truncamento.
- [ ] **Eliminação da Barra Poluída:** A barra horizontal redundante de navegação no rodapé do `AppHeader` foi removida, liberando área útil vertical.
- [ ] **Zero Overflow Horizontal Involuntário:** Nenhuma página gera barra de rolagem horizontal no `<body>` em resoluções de `320px`, `360px`, `375px`, `390px`, `414px` ou `768px`.
- [ ] **Filtros Flexíveis:** As barras de filtro de Recursos, Transações e Integrantes se acomodam em grids fluidos no mobile sem quebrar bordas nem cortar labels.
- [ ] **Modais Responsivos:** Todos os modais abrem com margem segura de no mínimo `16px` nas bordas (`w-[calc(100vw-2rem)]`), respeitam `max-h-[90dvh]` e mantêm o botão de fechar e o rodapé sempre acessíveis.
- [ ] **Tabelas com Rolagem Suave:** Tabelas matriciais densas contam com rolagem horizontal suave e sem distorção das células.
- [ ] **Compilação e Tipagem:** `npm run build` e `npx tsc --noEmit` passam com código de saída 0 sem warnings ou erros de tipo.

---

## 8. Plano de Execução Passo a Passo

1. **Fase 1: Primitivo de UI e Navegação Mobile**
   - Criar `src/components/ui/sheet.tsx` com Radix Dialog e `tailwind-variants`.
   - Criar `src/components/layout/mobile-nav-drawer.tsx`.
   - Refatorar `src/components/layout/app-header.tsx` para incluir o botão hambúrguer e remover a barra secundária inferior.
2. **Fase 2: Layout Base e Shell**
   - Atualizar `src/components/layout/dashboard-shell.tsx` com paddings adaptativos (`p-4 sm:p-6 lg:p-8`) e tipografia fluida para títulos de página.
   - Refatorar `src/components/ui/dialog.tsx` para garantir `w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto sm:max-w-lg` e rodapé empilhado.
3. **Fase 3: Tabelas e Barras de Filtros**
   - Refatorar `src/components/tables/resources-data-table.tsx` (filtros e ações responsivas).
   - Refatorar `src/components/tables/transactions-data-table.tsx`.
   - Refatorar `src/components/tables/team-members-data-table.tsx`.
4. **Fase 4: Dashboards, Gráficos e ROI**
   - Ajustar `src/components/dashboard/kpi-cards.tsx`.
   - Ajustar `src/components/dashboard/cash-flow-timeline.tsx` e `src/components/dashboard/physical-financial-schedule.tsx`.
   - Ajustar `src/components/roi/roi-view.tsx` e `src/components/roi/return-actions-view.tsx`.
   - Ajustar `src/app/equipe/page.tsx` e `src/components/auth/login-form.tsx`.
5. **Fase 5: Modais**
   - Revisar e ajustar todos os modais em `src/components/modals/` garantindo formulários em coluna única no mobile.
6. **Fase 6: Validação e Testes**
   - Testar o build com `npm run build`.
   - Simular viewports de `320px`, `375px`, `768px` e `1280px`.
