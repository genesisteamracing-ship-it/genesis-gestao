# Quickstart & Validation Guide: Mapa Organizacional e Hierárquico de Stakeholders

**Feature**: `001-stakeholder-hierarchy-map`  
**Date**: 2026-11-03

## Pré-requisitos

1. Dependências instaladas no diretório da aplicação (`stem-erp/`):
   ```powershell
   cd stem-erp
   npm install
   ```
2. Banco de dados sincronizado com o schema Prisma atualizado:
   ```powershell
   npx prisma generate
   npx prisma db push
   ```

## Cenários de Validação Ponta a Ponta

### Cenário 1: Validação Automatizada da Hierarquia (`SESI → Diretoria → Técnicos → Professores`)
Execute a bateria de testes unitários e de integração:
```powershell
cd stem-erp
npm test
```
**Resultado esperado**:
- Todos os testes em `src/components/communication/__tests__/` passam em menos de 3 segundos.
- O teste da árvore hierárquica (`communication-hierarchy.test.ts`) comprova que, ao cadastrar o parceiro `"SESI"` com `"Diretoria"` (Alto Poder / Alto Interesse), `"Técnicos"` (Baixo Poder / Alto Interesse) e `"Professores"` (Baixo Poder / Baixo Interesse), a árvore gerada possui o ramo `"SESI"` encadeando verticalmente `Diretoria` → `Técnicos` → `Professores`, além dos cartões de planos ativos na base.

### Cenário 2: Verificação de Tipagem Estrita e Linting
```powershell
cd stem-erp
npx tsc --noEmit
npm run lint
```
**Resultado esperado**:
- Zero erros de compilação TypeScript (`strict: true`, zero `any`).
- Zero violações de ESLint ou uso de cores hexadecimais hardcoded.

### Cenário 3: Uso Interativo na Página `/comunicacao`
1. Inicie o servidor de desenvolvimento (`npm run dev` em `stem-erp/`) e acesse `http://localhost:3000/comunicacao`.
2. Verifique que a visualização principal abre diretamente no **Mapa Organizacional de Stakeholders** dentro do `<DashboardShell>` (com barra lateral fixa em desktop e menu gaveta no mobile).
3. Clique em **"Novo Stakeholder"** (ou no botão `+` de um nó de Parceiro no gráfico):
   - Cadastre `Organização: SESI`, `Nome: Diretoria`, `Poder: Alto`, `Interesse: Alto`.
   - Cadastre `Organização: SESI`, `Nome: Técnicos`, `Poder: Baixo`, `Interesse: Alto`.
   - Cadastre `Organização: SESI`, `Nome: Professores`, `Poder: Baixo`, `Interesse: Baixo`.
4. Confira a árvore renderizada com conectores ortogonais exibindo `SESI` → `Diretoria` → `Técnicos` → `Professores` e os cartões de planos/ações na base.
5. Clique em qualquer nó do gráfico para inspecionar detalhes, gerar relatório automatizado ou criar plano de comunicação.
