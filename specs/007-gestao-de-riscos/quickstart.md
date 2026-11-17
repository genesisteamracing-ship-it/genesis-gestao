# Quickstart Validation Guide: Módulo de Gestão de Riscos e Oportunidades

**Feature**: `007-gestao-de-riscos` | **Date**: 2026-11-12

## Pré-requisitos
- Ambiente Node.js configurado em `stem-erp/`.
- Banco PostgreSQL acessível via `DATABASE_URL` e `DATABASE_URL_UNPOOLED` em `stem-erp/.env`.
- Backup pré-migração executado (`npm run db:backup` dentro de `stem-erp/`).

## Aplicação do Schema (Seguro / Zero Reset)
1. Executar `npm run db:backup` em `stem-erp/`.
2. Executar `npm run db:safe-push` em `stem-erp/` para sincronizar os modelos `RiskItem` e `RiskReview`.

## Validação Automatizada
1. **Typecheck**: `npx tsc --noEmit` (em `stem-erp/`).
2. **Lint**: `npm run lint` (em `stem-erp/`).
3. **Testes Unitários & Componentes**: `npm test` (em `stem-erp/`), cobrindo:
   - Cálculo de matriz 5×5, tratamento de `None` e agregação percentual para os dois gráficos de pizza.
   - Coordenadas e agrupamento de bolinhas do plano cartesiano.
   - Esquemas Zod de criação, edição e revisão.
   - Hook `useRisks` e componentes de visualização (estados Loading, Error, Empty e Success).
4. **Testes E2E (Playwright)**: `npx playwright test e2e/risks.spec.ts` validando cadastro de risco/oportunidade, gráficos de pizza, plano cartesiano, tabela (5 colunas obrigatórias) e registro de revisão em desktop e mobile (`375×667`).

## Validação Manual (Smoke Check)
1. Iniciar servidor local (`npm run dev` em `stem-erp/`) e acessar `/riscos`.
2. Cadastrar ao menos 3 riscos e 1 oportunidade variando setores, chances (`Quase certo`..`None`) e consequências (`Catastrófica`..`None`).
3. Conferir que os dois gráficos de pizza somam 100%, o plano cartesiano posiciona as bolinhas nas coordenadas corretas e a tabela exibe `Setor`, `Probabilidade de ocorrer`, `Consequência de ocorrência`, `Risco` e `Observações`.
4. Abrir o menu de engrenagem de um item, registrar uma revisão alterando probabilidade/status e confirmar atualização imediata nos gráficos e no histórico.
