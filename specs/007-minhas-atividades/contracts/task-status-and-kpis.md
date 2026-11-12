# Contracts: Atualização de Status e Consulta de Minhas Atividades

**Feature**: `007-minhas-atividades` | **Date**: 2026-11-12

## 1. Server Action: `updateMyTaskStatusAction`

**Localização**: `src/actions/tasks.actions.ts`

### Assinatura

```ts
export async function updateMyTaskStatusAction(
  input: UpdateMyTaskStatusInput
): Promise<TaskActionResult>
```

### Payload de Entrada (`UpdateMyTaskStatusInput`)

```ts
{
  teamId: string;
  taskId: string;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  revision: number;
}
```

### Pré-condições & Autorização

1. Sessão autenticada válida com acesso ao módulo `tasks`.
2. `scope` resolvido (`teamId` corresponde à equipe ativa e `canEdit === true`, bloqueando `AUDITOR`).
3. A tarefa pertence ao `teamId` informado.
4. O usuário autenticado possui atribuição na tarefa (papel `R` ou `A`) ou permissão editorial de equipe, sendo que `AUDITOR` é sempre negado.
5. `revision` enviado corresponde à versão atual da tarefa no banco (controle otimista de concorrência).

### Comportamento de Saída

- **Sucesso**: `{ ok: true }` — Atualiza `status`, `completedAt`/`cancelledAt` conforme matriz de transição e incrementa `revision`, executando `revalidatePath("/tarefas")`.
- **Erro de Validação**: `{ ok: false, message: "Dados inválidos para atualizar o status." }`
- **Erro de Permissão**: `{ ok: false, message: "Você tem acesso somente para consulta." }`
- **Erro de Concorrência / Não encontrada**: `{ ok: false, message: "A tarefa foi atualizada por outro integrante. Recarregue para ver a versão atual." }`

---

## 2. Contrato de Serviço: `updateTaskStatus`

**Localização**: `src/services/task-service.ts`

Executa a mutação dentro de `prisma.$transaction` garantindo atomicidade entre validação do editor ativo (`requireActiveEditor`), verificação de atribuição/equipe, cálculo de `completedAt` / `cancelledAt` e verificação de `revision`.

---

## 3. Contrato de UI e Navegação

### 3.1 Registro de Aba e Menu Lateral (`src/lib/task-navigation.ts`)

```ts
{
  id: "my-activities",
  href: "/tarefas?tab=my-activities",
  title: "Minhas atividades",
  label: "Minhas atividades",
  subtitle: "Acompanhe suas atividades por prazo limite, atualize o status e monitore seu desempenho.",
}
```

### 3.2 Contrato de Paginação e Ações de Linha

- **Paginação**: Fixa em `pageSize = 10`, exibindo à esquerda `Mostrando {startRow}-{endRow} de {totalFiltered} atividades` e à direita `Página {page} de {totalPages}` com 4 botões (`Primeira página`, `Página anterior`, `Próxima página`, `Última página`).
- **Menu de Ações da Linha**: Botão de engrenagem (`Settings` icon, `aria-label="Ações para {titulo}"`) abrindo `<DropdownMenuContent align="end">` com:
  - Marcar como **A fazer** (`TODO`)
  - Marcar como **Em andamento** (`IN_PROGRESS`)
  - Marcar como **Concluída** (`DONE`)
  - Marcar como **Cancelada** (`CANCELLED`)
  - Separador + **Ver detalhes** (abre modal/painel de detalhes da tarefa)
- **Desabilitação para Auditor**: Quando `canEdit === false`, os itens de alteração de status ficam ocultos ou desabilitados com feedback claro de modo leitura.
