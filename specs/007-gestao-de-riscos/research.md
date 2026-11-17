# Research & Technical Decisions: Módulo de Gestão de Riscos e Oportunidades

**Feature**: `007-gestao-de-riscos` | **Date**: 2026-11-12

## 1. Visualização de Gráficos (Pizza + Plano Cartesiano em Bolinhas)
- **Decision**: Utilizar `Recharts` (já instalado no projeto na versão `3.10.1`) para os dois gráficos de pizza (`PieChart` / `Pie` / `Cell` / `Tooltip` / `Legend`) e para o gráfico em plano cartesiano (`ScatterChart` / `Scatter` / `XAxis` / `YAxis` / `ZAxis` / `CartesianGrid` / `ReferenceArea` / `Tooltip`).
- **Rationale**: A Constituição do projeto padroniza `Recharts` para visualização de dados analíticos, evitando dependências extras. O `ScatterChart` permite plotar coordenadas discretas (Probabilidade `0..5` × Consequência `0..5`) com bolinhas (`Scatter`), tamanho proporcional ou agrupado por coordenada (`ZAxis`) e faixas de criticidade via `ReferenceArea` usando tokens semânticos (`var(--destructive)`, `var(--warning)`, `var(--success)`, `var(--muted)`).
- **Alternatives considered**:
  - `@xyflow/react`: Indicado para grafos e árvores (como WBS/Stakeholders), mas inadequado para gráficos estatísticos de pizza e dispersão cartesiana com eixos graduados.
  - SVG manual: Aumentaria complexidade de responsividade, tooltips e acessibilidade sem necessidade.

## 2. Tratamento de `None` e Sobreposição no Plano Cartesiano
- **Decision**: Mapear as escalas em valores numéricos discretos para o cálculo e plotagem:
  - Probabilidade: `NONE` = 0, `RARA` = 1, `IMPROVAVEL` = 2, `POSSIVEL` = 3, `PROVAVEL` = 4, `QUASE_CERTO` = 5.
  - Consequência: `NONE` = 0, `DESPREZIVEL` = 1, `PEQUENA` = 2, `MODERADA` = 3, `GRANDE` = 4, `CATASTROFICA` = 5.
  - Quando dois ou mais registros ocupam a mesma coordenada `(probabilidade, consequência)`, agrupar ou aplicar leve deslocamento determinístico por índice no quadrante da célula (micro-offset) + tooltip/painel listando os itens daquela coordenada, mantendo a posição fiel à célula.
- **Rationale**: Garante que nenhum risco com `None` quebre o gráfico ou suma da análise, enquanto itens na mesma coordenada permanecem todos visíveis e clicáveis como bolinhas individuais.
- **Alternatives considered**:
  - Ocultar registros `None` do plano cartesiano: Violaria a visibilidade de riscos recém-cadastrados aguardando avaliação.

## 3. Cálculo de Priorização (Matriz 5×5)
- **Decision**: Calcular `score = probabilityWeight * consequenceWeight` quando ambos forem `1..5`:
  - `score >= 15`: **Crítico** (`CRITICAL`)
  - `score >= 9 && score < 15`: **Alto** (`HIGH`)
  - `score >= 4 && score < 9`: **Médio** (`MEDIUM`)
  - `score >= 1 && score < 4`: **Baixo** (`LOW`)
  - Qualquer eixo igual a `0` (`None`): **Não avaliado** (`UNASSESSED`)
- **Rationale**: Função pura determinística e facilmente testável (`100%` cobertura unitária), alinhada a matrizes padrão de gestão de riscos em projetos (ISO 31000 / PMBOK).
- **Alternatives considered**:
  - Priorização manual livre: Aumenta subjetividade e reduz consistência entre revisões.

## 4. Integração de Setores, Temporada e Permissões (RBAC)
- **Decision**:
  - Reutilizar o enum `DeliveryGroup` existente no Prisma para o campo `sector` (`ENGINEERING_CAD`, `MANUFACTURING_CNC`, `PIT_DISPLAY`, `MARKETING_SPONSOR`, `PROJECT_MANAGEMENT`, `SOCIAL_PROJECT`), garantindo consistência total com Tarefas e WBS.
  - Vincular `RiskItem` a `teamId` e `season` (string de temporada compatível com `SeasonProvider`, ex.: `"2026"`).
  - Adicionar a chave `"risks"` em `SystemModuleKey` (`src/types/auth.ts` e `src/lib/permissions.ts`) para controle granular por módulo no painel de permissões e no `AppSidebar`, garantindo que `AUDITOR` opere apenas em leitura.
- **Rationale**: Evita duplicação de tabelas de setores e segue o modelo de autorização já consolidado na spec `003-module-access-permissions`.
- **Alternatives considered**:
  - Criar tabela separada de setores em texto livre: Fragmentaria filtros e relatórios entre módulos.

## 5. Tabela Padronizada e Padrões de UI
- **Decision**: Utilizar `@tanstack/react-table` com `pageSize: 10` fixo, rodapé padrão de 4 botões (`ChevronsLeft`, `ChevronLeft`, `ChevronRight`, `ChevronsRight`), menu de engrenagem (`Settings` + `DropdownMenu`) na coluna de ações e `<DashboardShell>` com `title` e `subtitle` obrigatórios na rota `/riscos`.
- **Rationale**: Conformidade integral com os Core Rules 6, 8 e 9 de `AGENTS.md` e com a Constituição v1.3.0.
