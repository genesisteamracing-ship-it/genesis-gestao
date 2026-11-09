# Contrato do módulo Tarefas

## Navegação e acesso

- `/tarefas` abre no `DashboardShell` com abas **Tarefas**, **Gantt**, **Caminhos de risco** e **Matriz RACI**, cada uma com título e subtítulo. Desktop e mobile exibem a entrada conforme a permissão `tasks`.
- A rota e as ações verificam sessão e permissão. Usuários comuns ficam restritos à própria equipe ativa. Um superadministrador pode consultar uma equipe ativa selecionada e validada no servidor. Mutação exige ser membro ativo da equipe em contexto e não ser auditor.
- O painel de permissões concede ou revoga `tasks` por usuário. Concessões individuais e em lote verificam o escopo do administrador para cada alvo no servidor. Não administradores começam com a permissão desabilitada, inclusive contas já existentes.
- A equipe dos dados é resolvida no servidor. Ações de escrita podem receber a equipe esperada da tela para detectar aba desatualizada, sem usá-la como autorização. Um ID de outra equipe retorna o mesmo resultado de item inexistente.

## Operações da aplicação

| Operação | Entrada funcional | Resultado |
| --- | --- | --- |
| Consultar módulo | Sessão e equipe ativa resolvidas no servidor | Tarefas, setores, pessoas elegíveis e históricas, dependências, caminhos e capacidade de edição, restritos ao escopo. |
| Criar tarefa | Título, setor, datas, descrição opcional e papéis R/C/I opcionais | Tarefa A fazer com A derivado do usuário autenticado. |
| Editar tarefa e RACI | ID, revisão esperada e campos alteráveis, incluindo estado e papéis | Atualização atômica. A, equipe e autor são imutáveis. |
| Adicionar dependência | IDs de predecessora e sucessora | Ligação salva ou rejeição com mensagem de duplicidade, autorreferência ou ciclo. Conflito de datas gera indicador. |
| Remover dependência | Par ordenado de tarefas | Ligação removida. Caminhos que usam o par continuam disponíveis, marcados como incompletos. |
| Criar ou editar caminho | Nome, motivo, IDs ordenados das etapas e, em edição, ID e revisão esperada | Caminho salvo após validar todos os pares. Se houver inconsistência, a versão anterior permanece. |

Operações usam entradas validadas com Zod e respostas tipadas com dados ou erro. Categorias esperadas incluem acesso negado, item ausente, campo inválido, aba desatualizada, conflito de edição e conflito transitório. Mensagens explicam como corrigir a entrada ou recarregar. Datas chegam ao cliente no formato `YYYY-MM-DD`. Mutações concluídas atualizam as visões por uma origem de dados comum, preservando os filtros ativos.

## Comportamento por visão

- **Tarefas** — Lista com filtro por setor e paginação de dez itens. Usuários com edição podem criar e abrir as ações de linha no menu de engrenagem. Detalhes mostram datas, estado, setor, papéis, dependências e pendência de executor.
- **Matriz RACI** — Linhas de tarefas, colunas de pessoas, letras por célula, legenda curta e filtro por setor da tarefa. Usar cabeçalhos de tabela semânticos, paginação fixa e rolagem horizontal contida. Um membro com mais de um papel exibe todas as letras. Nomes iguais mantêm colunas separadas por identidade.
- **Gantt** — Grade rolável por dia ou semana. Datas inclusivas, estado por texto e estilo, setas dirigidas e navegação por teclado até os detalhes. Filtro de setor oculta as barras fora do setor, mantendo o nome, setor e direção de cada ligação com uma ponta visível. Conflito de datas tem indicação textual. O destaque afeta somente as barras e os pares consecutivos do caminho válido e respeita o filtro em vigor.
- **Caminhos de risco** — Seleção do caminho salvo e sequência ordenada com origem identificada, motivo e ligações ausentes. A edição usa seletores de sucessoras e suporta teclado. A ação **Destacar no Gantt** abre a visualização gráfica do caminho válido. Uma sequência incompleta permanece visível com aviso e a ação desabilitada.
- **Estados** — Carregamento com skeleton, erro com mensagem e nova tentativa, vazio contextual, dados carregados. Sem dependências, orientar sobre o primeiro vínculo. Estados e destaques precisam permanecer distinguíveis sem depender apenas de cor.
