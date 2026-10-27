# Spec: Temporada da Equipe e Meses Dinâmicos do Fluxo de Caixa

## 1. Contexto e problema
Hoje o ERP assume uma linha do tempo fixa de **6 meses** ("Mês 1…Mês 6", `PROJECT_MONTHS`).
Cada lançamento exige que o usuário escolha manualmente o `referenceMonth`, o que gera
inconsistência entre a **data** informada e o **mês** do fluxo de caixa.

## 2. Objetivos
1. Ao **cadastrar a equipe**, informar **Temporada** (ex.: `2025/2026`, `2026/2027`), **data de início** e **data de fim**.
2. Os **meses do fluxo de caixa** (dashboard, cronograma físico-financeiro, filtros e combos) passam a ser
   **gerados a partir do intervalo** início → fim (ex.: `Ago/2025 … Jul/2026`).
3. No **lançamento de transação** o campo "Mês de referência" é **removido**: o mês é **derivado da data** informada.

## 3. Fora de escopo
- Editar a temporada de uma equipe já criada (fica para iteração futura).
- Múltiplas temporadas simultâneas por equipe (1 equipe = 1 temporada ativa).
- Migração de dados históricos além do fallback descrito em 6.

## 4. Regras de negócio
| # | Regra |
|---|-------|
| RN1 | `season` segue o padrão `AAAA/AAAA+1` (ex.: `2025/2026`). |
| RN2 | `startDate < endDate`. |
| RN3 | Duração mínima 1 mês e **máxima 24 meses** (protege UI/gráficos). |
| RN4 | Meses = cada mês-calendário tocado pelo intervalo (inclusive o mês do início e o do fim). |
| RN5 | `index` do mês é 1-based a partir do mês de início; é o valor persistido em `referenceMonth`/`plannedMonth` (mantém compatibilidade com agregações existentes). |
| RN6 | Data de transação **fora** do intervalo da temporada é **rejeitada** com mensagem clara. |
| RN7 | `plannedMonth` (planejamento não tem data) é escolhido num combo com os **meses da temporada**; valida `1 ≤ plannedMonth ≤ nº de meses`. |
| RN8 | Cálculo em **UTC** (datas `YYYY-MM-DD` salvas às 12:00Z) para evitar deslocamento por fuso. |

## 5. Modelo de dados (Prisma)
`Team` ganha (todos opcionais para não quebrar equipes existentes):
```prisma
season          String?    // "2025/2026"
seasonStartDate DateTime?
seasonEndDate   DateTime?
```
`referenceMonth` e `plannedMonth` permanecem `Int` (índice do mês na temporada).

## 6. Fallback para equipes legadas (sem temporada)
`resolveTeamSeason()` devolve uma temporada padrão de **6 meses** iniciando no mês de `createdAt`
(rótulo "Temporada atual"), preservando os índices 1…6 já gravados.

## 7. Arquitetura
```
src/lib/season.ts                 # funções puras (build/validate/index) — testável
src/lib/validations/auth.ts       # createTeamSchema + campos de temporada
src/lib/validations/financial.ts  # remove referenceMonth do create; max de mês relaxado
src/services/auth-service.ts      # createTeamService persiste temporada
src/services/financial-service.ts # resolveActiveTeam retorna season; derivação de referenceMonth; calculadores recebem meses
src/types/financial.ts            # SeasonDTO, SeasonMonthDTO, seasonMonths no DashboardMetricsDTO
src/providers/season-provider.tsx # Context + useSeasonMonths() (evita prop drilling)
src/components/layout/dashboard-shell.tsx  # injeta SeasonProvider
```
### 7.1 Contratos
```ts
interface SeasonMonthDTO { index: number; key: string /* YYYY-MM */; label: string /* "Ago/2025" */ }
interface SeasonDTO { label: string; startDate: string; endDate: string }
```
### 7.2 Funções puras (`season.ts`)
- `buildSeasonMonths(start, end): SeasonMonthDTO[]`
- `getSeasonMonthIndex(start, end, date): number | null` (null = fora da temporada)
- `validateSeasonRange(start, end): string | null` (mensagem de erro)
- `buildSeasonOptions(baseYear?): string[]` (`["2025/2026", …]`)
- `buildLegacySeason(createdAt): { start, end }`

## 8. UI
- **Cadastrar equipe**: Select de **Temporada**, `input[type=date]` **Início** e **Fim**, prévia "N meses: Ago/2025 … Jul/2026".
- **Lançar/Editar transação**: remove "Mês de referência"; exibe dica "Mês: Set/2025" derivada da data.
- **Planejar/Editar recurso**: combo de mês lista os meses da temporada.
- **Dashboard / filtros / tabelas**: rótulos vindos de `useSeasonMonths()`.

## 9. Estados de UI
Loading/Erro/Vazio/Sucesso preservados; erros de validação de temporada exibidos via `FormMessage` e `toast`.

## 10. Critérios de aceite
- [ ] Criar equipe sem temporada válida é bloqueado (RN1–RN3).
- [ ] Equipe nova com 2025/2026 (01/08/2025–31/07/2026) mostra 12 meses no fluxo de caixa.
- [ ] Transação com data dentro da temporada cai no mês correto sem escolher mês.
- [ ] Transação com data fora da temporada é rejeitada.
- [ ] Equipes antigas continuam funcionando (fallback de 6 meses).
- [ ] `npx tsc --noEmit` e `npm run build` sem erros.

## 11. Plano de execução
1. Schema Prisma + `db push`.
2. `season.ts` + testes de sanidade via script.
3. Validações, `createTeamService`, diálogo de equipe.
4. `resolveActiveTeam`, calculadores, derivação de mês, DTOs.
5. `SeasonProvider` + shell + substituição de `PROJECT_MONTHS` nos componentes.
6. Seed, typecheck, build, commit.
