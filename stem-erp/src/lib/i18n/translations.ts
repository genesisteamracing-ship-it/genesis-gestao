import type { AppLocale } from "./locale-types";

export const PT_TO_EN_DICTIONARY: Readonly<Record<string, string>> = {
  // Marca, idioma e cabeçalho global
  "Gestão STEM Racing": "STEM Racing Management",
  "Menu Lateral": "Side Menu",
  "Navegação Principal": "Main Navigation",
  "Abrir menu de navegação": "Open navigation menu",
  "Alternar menu lateral": "Toggle side menu",
  "Alternar tema claro e escuro": "Toggle light and dark theme",
  "Tema da Interface": "Interface Theme",
  Claro: "Light",
  Escuro: "Dark",
  Idioma: "Language",
  "Selecionar idioma": "Select language",
  "Português (Brasil)": "Portuguese (Brazil)",
  "English (United States)": "English (United States)",
  "Selecionar equipe": "Select team",
  Equipe: "Team",
  "Sair da conta": "Sign out",
  Sair: "Sign out",
  "Carregando...": "Loading...",
  Atualizar: "Refresh",
  "Atualizar agora": "Refresh now",
  "Tentar novamente": "Try again",

  // Autenticação e tela de login
  "Entrar na plataforma": "Sign in to platform",
  "Informe suas credenciais para gerenciar recursos e livro caixa.":
    "Enter your credentials to manage resources and the cash ledger.",
  "E-mail de acesso": "Access email",
  "E-mail de Acesso": "Access Email",
  Senha: "Password",
  "Lembrar de mim": "Remember me",
  "Dúvidas de acesso?": "Need access help?",
  "Contate o SuperAdmin da equipe": "Contact the team SuperAdmin",

  // Navegação principal (Sidebar & Mobile Drawer)
  "Escritório Virtual": "Virtual Office",
  Finanças: "Finance",
  Dashboard: "Dashboard",
  Planejamento: "Planning",
  "Livro Caixa": "Cash Ledger",
  ROI: "ROI",
  "Visão Geral & Cotas": "Overview & Tiers",
  "Ações de Retorno": "Return Actions",
  Comunicação: "Communication",
  "Mapa Hierárquico": "Hierarchy Map",
  "Gerador de Relatórios": "Report Generator",
  Diretório: "Directory",
  Agendamentos: "Schedules",
  "Matriz Mendelow": "Mendelow Matrix",
  Tarefas: "Tasks",
  "Lista de tarefas": "Task list",
  "Minhas atividades": "My activities",
  Gantt: "Gantt",
  "Rede PERT": "PERT Network",
  "Caminhos de risco": "Risk paths",
  "Matriz RACI": "RACI Matrix",
  "Gestão de Riscos": "Risk Management",
  Documentos: "Documents",
  "WBS / EAP": "WBS / Scope Tree",
  "Presença nos Treinos": "Training Attendance",
  "Equipe & Acessos": "Team & Access",
  Equipes: "Teams",
  Integrantes: "Members",
  "Permissões de Acesso": "Access Permissions",

  // Títulos e subtítulos de páginas e abas
  "Visão geral financeira, métricas consolidadas e fluxo de caixa da temporada":
    "Financial overview, consolidated metrics, and season cash flow",
  "Estrutura de contas, teto de gastos e orçamento previsto da temporada":
    "Account structure, spending cap, and planned season budget",
  "Registro e conciliação de receitas, despesas e fluxo financeiro da temporada":
    "Recording and reconciliation of revenues, expenses, and seasonal cash flow",
  "Acompanhe em tempo real onde cada integrante está alocado e qual tarefa está executando.":
    "Track in real time where each member is assigned and which task they are executing.",
  "Gestão de escuderias, isolamento de dados e governança multi-equipe da temporada":
    "Team management, data isolation, and multi-team governance for the season",
  "Gestão de membros por equipe, redefinição de senhas, credenciais e governança de acessos":
    "Team member management, password resets, credentials, and access governance",
  "Configure individualmente o acesso de cada usuário aos módulos do sistema com botões SIM e NÃO":
    "Individually configure each user's access to system modules using YES and NO toggles",
  "Acompanhe presenças, faltas automáticas, dashboards de frequência e relatórios individuais nos treinos da equipe.":
    "Track attendance, automatic absences, frequency dashboards, and individual reports for team trainings.",
  "Gestão de Riscos & Oportunidades": "Risk & Opportunity Management",
  "Registro, análise cartesiana, planos proativos, contingência e revisões ao longo do projeto.":
    "Registration, Cartesian analysis, proactive plans, contingency, and project reviews.",
  "Organize as atividades e os responsáveis de cada setor.":
    "Organize activities and owners for each sector.",
  "Acompanhe suas atividades por prazo limite, atualize o status e monitore seu desempenho.":
    "Track your activities by due date, update status, and monitor your performance.",
  "Acompanhe prazos e dependências na linha do tempo.":
    "Track schedules and dependencies along the timeline.",
  "Visualize dependências lógicas, paralelismo, folgas e o caminho crítico do projeto.":
    "Visualize logical dependencies, parallelism, slack, and the project critical path.",
  "Mostre quais atividades podem ser afetadas por um atraso.":
    "Highlight which activities could be affected by a delay.",
  "Consulte quem responde, executa, é consultado ou informado.":
    "Check who is accountable, responsible, consulted, or informed.",
  "Mapa Organizacional & Comunicação": "Organizational Map & Communication",
  "Árvore hierárquica de parceiros e stakeholders por nível de Poder e Interesse, réguas ativas e relatórios automatizados":
    "Hierarchical tree of partners and stakeholders by Power and Interest, active cadences, and automated reports",
  "Criação, exportação e envio de relatórios executivos, técnicos e combinados para stakeholders":
    "Creation, export, and delivery of executive, technical, and combined stakeholder reports",
  "Diretório de Stakeholders": "Stakeholders Directory",
  "Gerenciamento completo de contatos, organizações parceiras, cargos e preferências de comunicação":
    "Complete management of contacts, partner organizations, roles, and communication preferences",
  "Agendamentos de Comunicação": "Communication Schedules",
  "Programação de envios, calendário de contatos e histórico consolidado de interações com parceiros":
    "Delivery scheduling, contact calendar, and consolidated partner interaction history",
  "Matriz Poder x Interesse": "Power vs. Interest Matrix",
  "Matriz Poder × Interesse": "Power × Interest Matrix",
  "Mapeamento estratégico de engajamento para direcionar a comunicação e governança dos stakeholders":
    "Strategic engagement mapping to guide stakeholder communication and governance",
  "ROI & Gestão de Patrocinadores": "ROI & Sponsor Management",
  "Painel de contrapartidas, retorno sobre investimento das empresas e gestão de cotas":
    "Deliverables panel, company return on investment, and sponsorship tier management",
  "Ações de Retorno aos Patrocinadores": "Sponsor Return Actions",
  "Registro auditável de entregas, exposições de marca e contrapartidas realizadas pela equipe":
    "Auditable record of deliverables, brand exposures, and sponsor activations completed by the team",
  "Estrutura Analítica do Projeto (WBS / EAP) e Decomposição de Escopo":
    "Work Breakdown Structure (WBS) and Scope Decomposition",

  // Constantes de domínio (constants.ts)
  "Engenharia & CAD": "Engineering & CAD",
  "Manufatura & CNC": "Manufacturing & CNC",
  "Pit Display & Estande": "Pit Display & Booth",
  "Marketing & Patrocínio": "Marketing & Sponsorship",
  "Gestão do Projeto": "Project Management",
  "Projeto Social": "Social Project",
  Engenharia: "Engineering",
  Manufatura: "Manufacturing",
  "Pit Display": "Pit Display",
  Marketing: "Marketing",
  Gestão: "Management",

  "Compra Direta": "Direct Purchase",
  "Patrocínio Financeiro": "Financial Sponsorship",
  "Permuta / Parceria Técnica": "Barter / Technical Partnership",
  "Recursos Próprios / Rifa": "Own Funds / Raffle",

  "Origem (Receita / Aporte)": "Origin (Revenue / Contribution)",
  "Aplicação (Despesa / Saída)": "Application (Expense / Outflow)",
  "Origem (Receita / Entrada)": "Origin (Revenue / Inflow)",
  "Origem (Receita)": "Origin (Revenue)",
  "Aplicação (Despesa)": "Application (Expense)",
  "Receita (Origem)": "Revenue (Origin)",
  "Despesa (Aplicação)": "Expense (Application)",
  Origens: "Revenues",
  Aplicações: "Expenses",
  "(-) Aplicações": "(-) Expenses",
  "(+) Origens": "(+) Revenues",
  "(=) Saldo Acumulado": "(=) Cumulative Balance",

  "NF-e (Nota Fiscal)": "NF-e (Tax Invoice)",
  "Recibo Simples": "Simple Receipt",
  "Contrato de Patrocínio": "Sponsorship Contract",
  "PIX / Extrato Bancário": "PIX / Bank Statement",

  "Cota Bronze": "Bronze Tier",
  "Cota Prata": "Silver Tier",
  "Cota Ouro": "Gold Tier",
  "Cota Diamante": "Diamond Tier",
  Bronze: "Bronze",
  Prata: "Silver",
  Ouro: "Gold",
  Diamante: "Diamond",

  "Logo no Carro / Uniforme": "Logo on Car / Uniform",
  "Redes Sociais (Reels / Post)": "Social Media (Reels / Post)",
  "Pit Display & Eventos": "Pit Display & Events",
  "Imprensa & Portfólio Oficial": "Press & Official Portfolio",
  "Oficina em Projeto Social": "Social Project Workshop",
  "Outras Ativações de Marca": "Other Brand Activations",

  "SuperAdmin (Global)": "SuperAdmin (Global)",
  "Gestor Financeiro": "Finance Manager",
  "Líder / Integrante de Setor": "Sector Lead / Member",
  "Auditor (Somente Leitura)": "Auditor (Read-Only)",

  "Login Autorizado": "Authorized Login",
  "Senha Incorreta / Falha": "Incorrect Password / Failure",
  "Conta Bloqueada (Anti-Invasão)": "Account Locked (Anti-Intrusion)",
  "Bloqueado (Anti-Invasão)": "Locked (Anti-Intrusion)",
  "Logout Seguro": "Secure Logout",
  "Sessão Revogada": "Session Revoked",
  "Integrante Cadastrado": "Member Registered",
  "Permissão / Equipe Atualizada": "Permission / Team Updated",
  "Nova Equipe Criada": "New Team Created",

  // Constantes de Comunicação
  "Patrocinadores Corporativos": "Corporate Sponsors",
  "Direção & Coordenação Escolar": "School Leadership & Coordination",
  "Pais & Responsáveis": "Parents & Guardians",
  "Mentores e técnicos": "Mentors & Coaches",
  "Comunidade & Apoiadores": "Community & Supporters",
  "Comissão & Jurados STEM": "STEM Committee & Judges",
  "Baixo Poder": "Low Power",
  "Alto Poder": "High Power",
  "Baixo Interesse": "Low Interest",
  "Alto Interesse": "High Interest",
  Desinformado: "Unaware",
  Resistente: "Resistant",
  Neutro: "Neutral",
  "Apoiador Ativo": "Supportive",
  "Líder Defensor": "Leading Advocate",
  "WhatsApp Oficial": "Official WhatsApp",
  "E-mail Formal": "Formal Email",
  "Reunião / Alinhamento": "Meeting / Alignment",
  "Relatório Impresso / PDF": "Printed / PDF Report",
  Semanal: "Weekly",
  Quinzenal: "Biweekly",
  Mensal: "Monthly",
  Bimestral: "Bimonthly",
  Trimestral: "Quarterly",
  "Pós-Marco / Evento Crítico": "Post-Milestone / Critical Event",
  "Positivo / Elogio": "Positive / Praise",
  "Neutro / Informativo": "Neutral / Informative",
  "Crítica Construtiva / Atenção": "Constructive Criticism / Attention",
  "Nível 1 · Alto Poder & Alto Interesse": "Tier 1 · High Power & High Interest",
  "Nível 1 · Estratégico": "Tier 1 · Strategic",
  "Decisores chave e alta direção do parceiro (Gerenciar de Perto)":
    "Key decision-makers and senior partner leadership (Manage Closely)",
  "Nível 2 · Alto Poder & Baixo Interesse": "Tier 2 · High Power & Low Interest",
  "Nível 2 · Institucional": "Tier 2 · Institutional",
  "Autoridades regulatórias e conselhos (Manter Satisfeito)":
    "Regulatory authorities and boards (Keep Satisfied)",
  "Nível 3 · Baixo Poder & Alto Interesse": "Tier 3 · Low Power & High Interest",
  "Nível 3 · Tático / Técnico": "Tier 3 · Tactical / Technical",
  "Corpo técnico, coordenação e mentores (Manter Informado)":
    "Technical staff, coordinators, and mentors (Keep Informed)",
  "Nível 4 · Baixo Poder & Baixo Interesse": "Tier 4 · Low Power & Low Interest",
  "Nível 4 · Base / Operacional": "Tier 4 · Operational / Base",
  "Docentes, apoiadores e multiplicadores (Monitorar)":
    "Educators, supporters, and ambassadors (Monitor)",
  "Gerenciar de perto e envolver": "Manage closely & engage",
  "Manter satisfeito": "Keep satisfied",
  "Manter informado": "Keep informed",
  Monitorar: "Monitor",
  "Gerenciar de Perto (Alto Poder / Alto Interesse)":
    "Manage Closely (High Power / High Interest)",
  "Manter Satisfeito (Alto Poder / Baixo Interesse)":
    "Keep Satisfied (High Power / Low Interest)",
  "Manter Informado (Baixo Poder / Alto Interesse)":
    "Keep Informed (Low Power / High Interest)",
  "Monitorar (Baixo Poder / Baixo Interesse)":
    "Monitor (Low Power / Low Interest)",

  // Dashboard & Financeiro
  "Indicadores Financeiros Principais": "Key Financial Indicators",
  "Orçamento Previsto": "Planned Budget",
  "planejados na temporada": "planned in the season",
  "Total Arrecadado": "Total Raised",
  "de cobertura do orçamento": "of budget coverage",
  "Total Gasto": "Total Spent",
  "executado do orçamento": "of budget spent",
  "Saldo em Caixa Atual": "Current Cash Balance",
  "Margem positiva em caixa": "Positive cash margin",
  "Déficit acumulado": "Accumulated deficit",
  "Fluxo de Caixa Mensal": "Monthly Cash Flow",
  "Fluxo de Caixa": "Cash Flow",
  "Cronograma Físico-Financeiro": "Physical-Financial Schedule",
  "Dashboard & Fluxo": "Dashboard & Cash Flow",
  "Livro Caixa & Auditoria": "Cash Ledger & Audit",
  "Planejamento de Recursos": "Resource Planning",
  "Planejar Recurso": "Plan Resource",
  "+ Planejar Recurso": "+ Plan Resource",
  "Lançar Transação": "Record Transaction",
  "+ Lançar Transação": "+ Record Transaction",
  "Salvar no Planejamento": "Save to Planning",
  "Configuração da Temporada & Ciclo de Caixa":
    "Season Configuration & Cash Cycle",
  "Temporada Oficial": "Official Season",
  "Categoria Orçamentária": "Budget Category",
  "Categoria Contábil": "Accounting Category",
  "Nova categoria": "New category",
  "Nome da nova categoria...": "New category name...",
  "Nome do Recurso / Item": "Resource / Item Name",
  "Especificação do Recurso": "Resource Specification",
  "Estratégia de Aquisição": "Acquisition Strategy",
  "Tipo de Aquisição": "Acquisition Type",
  "Mês Planejado (Temporada)": "Planned Month (Season)",
  "Mês Previsto (Temporada)": "Forecast Month (Season)",
  "Valor Previsto (R$)": "Planned Amount (R$)",
  "Valor Realizado (R$)": "Actual Amount (R$)",
  "Uso Previsto (%)": "Planned Usage (%)",
  "Previsão de Uso (%)": "Usage Forecast (%)",
  "Método Comprobatório": "Supporting Method",
  "Método de Rastreabilidade / Comprovação": "Traceability / Proof Method",
  "Código da NF-e": "NF-e Code",
  "Natureza do Lançamento": "Transaction Nature",
  "Data da Operação": "Operation Date",
  "Data do Fato Gerador": "Event Date",
  "Descrição Auditável": "Auditable Description",
  "Descrição Detalhada do Fato Gerador": "Detailed Event Description",
  "Vincular a Item do Orçamento (Opcional)": "Link to Budget Item (Optional)",
  "Vincular a Recurso Planejado (Opcional)":
    "Link to Planned Resource (Optional)",
  "Nenhum vínculo (despesa/receita avulsa)":
    "No link (standalone expense/revenue)",
  "Sem vínculo direto com item planejado":
    "No direct link to a planned item",
  "Editar Lançamento Financeiro": "Edit Financial Transaction",
  "Excluir Lançamento": "Delete Transaction",
  "Excluir Recurso": "Delete Resource",
  "Buscar descrição ou NF-e...": "Search description or NF-e...",
  "Buscar recurso ou código...": "Search resource or code...",
  "Não há recursos cadastrados correspondentes aos filtros selecionados.":
    "No planned resources match the selected filters.",
  "Não há transações no livro caixa para os filtros aplicados.":
    "No cash ledger transactions match the applied filters.",
  "Nenhum recurso encontrado": "No resource found",
  "Nenhum lançamento encontrado": "No transaction found",

  // Cabeçalhos de tabelas gerais
  AÇÕES: "ACTIONS",
  Ações: "Actions",
  Ação: "Action",
  "AÇÃO / ATIVAÇÃO": "ACTION / ACTIVATION",
  DATA: "DATE",
  Data: "Date",
  "Data / Mês": "Date / Month",
  DESCRIÇÃO: "DESCRIPTION",
  Descrição: "Description",
  GRUPO: "GROUP",
  Grupo: "Group",
  "GRUPO & CATEGORIA": "GROUP & CATEGORY",
  CATEGORIA: "CATEGORY",
  Categoria: "Category",
  RECURSO: "RESOURCE",
  Recurso: "Resource",
  "ORÇADO / REALIZADO": "PLANNED / ACTUAL",
  STATUS: "STATUS",
  Status: "Status",
  "STATUS / AQUISIÇÃO": "STATUS / ACQUISITION",
  "Status / Aquisição": "Status / Acquisition",
  "STATUS / COMPROVANTE": "STATUS / PROOF",
  "Status / Comprovante": "Status / Proof",
  TIPO: "TYPE",
  Tipo: "Type",
  "TIPO / VALOR": "TYPE / AMOUNT",
  SETOR: "SECTOR",
  Setor: "Sector",
  "SETOR INTERNO & CARGO": "INTERNAL SECTOR & ROLE",
  INTEGRANTE: "MEMBER",
  Integrante: "Member",
  "INTEGRANTE & E-MAIL": "MEMBER & EMAIL",
  PERMISSÃO: "PERMISSION",
  "PERMISSÃO (RBAC)": "PERMISSION (RBAC)",
  "EQUIPE (ISOLADA)": "TEAM (ISOLATED)",
  "SEGURANÇA / SESSÕES": "SECURITY / SESSIONS",
  CRONOGRAMA: "SCHEDULE",
  EMPRESA: "COMPANY",
  "EMPRESA PATROCINADORA": "SPONSOR COMPANY",
  COTA: "TIER",
  Cota: "Tier",
  CONTATO: "CONTACT",
  Contato: "Contact",
  LANÇAMENTOS: "TRANSACTIONS",
  Lançamentos: "Transactions",
  "INVESTIMENTO (R$)": "INVESTMENT (R$)",
  "AÇÕES RETORNO": "RETURN ACTIONS",
  "RETORNO (R$)": "RETURN (R$)",
  "RETORNO GERADO": "GENERATED RETURN",
  "ROI ENTREGUE": "DELIVERED ROI",
  ALCANCE: "REACH",
  FREQUÊNCIA: "FREQUENCY",
  HORÁRIO: "TIME",
  PRESENÇAS: "ATTENDANCES",
  Presenças: "Attendances",
  FALTAS: "ABSENCES",
  Faltas: "Absences",
  Falta: "Absence",
  TREINOS: "TRAININGS",
  Treinos: "Trainings",
  "ID / REF": "ID / REF",
  Nome: "Name",
  "Nome Completo": "Full Name",
  "Nome da Empresa": "Company Name",
  "Nome da Equipe": "Team Name",
  Título: "Title",
  Mês: "Month",
  Observações: "Notes",
  Comprovante: "Receipt / Proof",
  "Grupo de Entrega": "Delivery Group",
  "Grupo / Setor de Entrega": "Delivery Group / Sector",
  "Setor Interno": "Internal Sector",
  "Setor Interno na Equipe": "Team Internal Sector",
  "Cargo no Setor": "Sector Role",
  Cargo: "Role",

  // Filtros, seletores e ações comuns
  Salvar: "Save",
  "Salvar Alterações": "Save Changes",
  "Salvar Empresa": "Save Company",
  "Salvar Nova Senha": "Save New Password",
  Criar: "Create",
  Editar: "Edit",
  "Editar Dados": "Edit Data",
  Excluir: "Delete",
  "Excluindo...": "Deleting...",
  "Confirmar Exclusão": "Confirm Deletion",
  "Confirmar exclusão?": "Confirm deletion?",
  "Digite EXCLUIR": "Type EXCLUIR",
  Cancelar: "Cancel",
  Fechar: "Close",
  Imprimir: "Print",
  "Exportar CSV": "Export CSV",
  "Exportar PDF": "Export PDF",
  "Exportando...": "Exporting...",
  "Exportar Relatório": "Export Report",
  "Exportar relatório PDF": "Export PDF report",
  "Relatório PDF": "PDF Report",
  "Imprimir ou exportar em PDF": "Print or export as PDF",
  "Resetar Filtro": "Reset Filter",
  "Resetar Filtros": "Reset Filters",
  "Limpar filtros": "Clear filters",
  "Limpar seleção": "Clear selection",
  Selecione: "Select",
  "Selecione a categoria": "Select category",
  "Selecione a cota": "Select tier",
  "Selecione a empresa": "Select company",
  "Selecione a empresa patrocinadora": "Select sponsor company",
  "Selecione a equipe": "Select team",
  "Selecione a estratégia": "Select strategy",
  "Selecione a permissão": "Select permission",
  "Selecione a temporada": "Select season",
  "Selecione o início": "Select start",
  "Selecione o integrante da equipe": "Select team member",
  "Selecione o método": "Select method",
  "Selecione o setor": "Select sector",
  "Selecione o tipo": "Select type",
  "Selecione os consultados": "Select consulted members",
  "Selecione os responsáveis": "Select owners",
  "Selecione um integrante": "Select a member",
  "Selecione um stakeholder": "Select a stakeholder",
  "Todos os setores": "All sectors",
  "Todos os Setores": "All Sectors",
  "Todos os tipos": "All types",
  "Todos os Tipos": "All Types",
  "Todos os status": "All statuses",
  "Todos os prazos": "All deadlines",
  "Todos os integrantes": "All members",
  "Todos os Meses": "All Months",
  "Todas as chances": "All probabilities",
  "Todas as consequências": "All consequences",
  "Todas as Cotas": "All Tiers",
  "Todas as datas": "All dates",
  "Todas as Disciplinas": "All Disciplines",
  "Todas as Empresas": "All Companies",
  "Todas as Equipes": "All Teams",
  "Todas as Permissões": "All Permissions",
  "Filtrar por chance": "Filter by probability",
  "Filtrar por consequência": "Filter by consequence",
  "Filtrar por data do treino": "Filter by training date",
  "Filtrar por grupo": "Filter by group",
  "Filtrar por integrante": "Filter by member",
  "Filtrar por prazo": "Filter by deadline",
  "Filtrar por setor": "Filter by sector",
  "Filtrar por status": "Filter by status",
  "Filtrar por tipo": "Filter by type",
  "Filtrar empresa...": "Filter company...",
  "Primeira página": "First page",
  "Página anterior": "Previous page",
  "Próxima página": "Next page",
  "Última página": "Last page",
  "Ver detalhes": "View details",
  "Ver Histórico": "View History",
  "Inspecionar Ficha": "Inspect Record",

  // Escritório Virtual
  "Carregando escritório virtual": "Loading virtual office",
  "Não foi possível carregar o escritório virtual":
    "Could not load the virtual office",
  "Painel do Escritório": "Office Dashboard",
  "Escritório (Canvas)": "Office (Canvas)",
  Lista: "List",
  "Modo de visualização do escritório": "Office view mode",
  "Em execução": "In progress",
  "Em atraso": "Overdue",
  Disponível: "Available",
  "Nenhuma tarefa em execução": "No active task in progress",
  "Marcar presença": "Check in",
  "Presença marcada": "Checked in",
  "Aumentar zoom": "Zoom in",
  "Diminuir zoom": "Zoom out",
  "Ajustar visualização": "Fit view",
  "Restaurar enquadramento": "Reset framing",

  // Presença nos Treinos
  "Carregando presença nos treinos": "Loading training attendance",
  "Indicadores de Presença nos Treinos": "Training Attendance Indicators",
  "Dashboards de Presença nos Treinos": "Training Attendance Dashboards",
  "Taxa de Presença": "Attendance Rate",
  Presente: "Present",
  Pontualidade: "Punctuality",
  "Último Treino": "Latest Training",
  "Proporção Geral": "Overall Ratio",
  "Todo o histórico": "All history",
  "Últimos 7 dias": "Last 7 days",
  "Últimos 30 dias": "Last 30 days",
  "Mês atual": "Current month",
  "Filtrar período dos dashboards": "Filter dashboard period",
  "Filtrar presença por data do treino": "Filter attendance by training date",
  "Buscar presença por integrante ou setor":
    "Search attendance by member or sector",
  "Buscar registro por integrante ou setor":
    "Search record by member or sector",
  "Buscar resumo por integrante ou setor":
    "Search summary by member or sector",
  "Relatório Individual": "Individual Report",
  "Relatório Individual (PDF)": "Individual Report (PDF)",
  "Histórico Individual (CSV)": "Individual History (CSV)",
  "Selecionar integrante": "Select member",
  "Selecionar integrante do relatório": "Select report member",
  "Selecionar período do relatório": "Select report period",
  "Sem integrantes para exibir.": "No members to display.",
  "Sem registros no período.": "No records in this period.",
  "Sem registros para exibir.": "No records to display.",
  "Sem setores para exibir.": "No sectors to display.",
  "Sem treinos para exibir.": "No training sessions to display.",
  "Mês anterior": "Previous month",
  "Próximo mês": "Next month",

  // Tarefas, Gantt, PERT, RACI e Caminhos de Risco
  "Carregando minhas atividades": "Loading my activities",
  "Buscar atividades": "Search activities",
  "Buscar integrante ou tarefa": "Search member or task",
  "Buscar integrante ou tarefa...": "Search member or task...",
  "Digite o nome da atividade...": "Enter activity name...",
  "Atividades encontradas": "Activities found",
  "Você não possui atividades atribuídas no momento.":
    "You have no assigned activities at the moment.",
  "Nenhuma atividade encontrada para os filtros selecionados.":
    "No activities found for the selected filters.",
  "Nenhuma atividade ativa para exibir": "No active activities to display",
  "Nenhuma atividade encontrada.": "No activities found.",
  "Nenhuma tarefa neste setor.": "No tasks in this sector.",
  "Nenhuma dependência.": "No dependencies.",
  "Abrir quadro de tarefas": "Open task board",
  "Detalhes da atividade selecionada.": "Selected activity details.",
  "Detalhes e vínculos": "Details & links",
  Atividade: "Activity",
  Tarefa: "Task",
  "Nova tarefa": "New task",
  "Editar tarefa": "Edit task",
  "Excluir tarefa": "Delete task",
  "Excluir Tarefa": "Delete Task",
  "Exportar Gantt em PDF": "Export Gantt as PDF",
  "Cronograma de Gantt": "Gantt Schedule",
  "Legenda de status do Gantt": "Gantt status legend",
  "Legenda (status)": "Legend (status)",
  "Verde: em dia": "Green: on track",
  "(dentro do planejado)": "(on schedule)",
  "Amarelo: atenção": "Yellow: attention",
  "(risco de atraso)": "(delay risk)",
  "Vermelho: atraso": "Red: delayed",
  "(fora do planejado)": "(behind schedule)",
  "Cinza: linha de base": "Gray: baseline",
  "(planejado)": "(planned)",
  "Linha de base (planejado)": "Baseline (planned)",
  "Caminho crítico": "Critical path",
  "(destaque em vermelho)": "(highlighted in red)",
  "Linha do tempo rolável": "Scrollable timeline",
  "Data de Início": "Start Date",
  "Data de Fim": "End Date",
  "Início planejado": "Planned start",
  "Término planejado": "Planned finish",
  "Automático (O + M + P)": "Automatic (O + M + P)",
  "Estimativa PERT (dias)": "PERT Estimate (days)",
  "Estimativa PERT (O / M / P)": "PERT Estimate (O / M / P)",
  "Duração calculada": "Calculated duration",
  "Duração esperada (Te)": "Expected duration (Te)",
  "Início mais cedo (ES)": "Early start (ES)",
  "Término mais cedo (EF)": "Early finish (EF)",
  "Início mais tarde (LS)": "Late start (LS)",
  "Término mais tarde (LF)": "Late finish (LF)",
  "Folga total (Slack)": "Total Slack",
  Folga: "Slack",
  "Maior folga": "Largest slack",
  "Prazo mínimo (Te)": "Minimum duration (Te)",
  "Prazo limite": "Due date",
  "Indicadores do cronograma": "Schedule indicators",
  "Indicadores de desempenho individual": "Individual performance indicators",
  "Progresso geral do cronograma": "Overall schedule progress",
  "Frentes paralelas": "Parallel tracks",
  "Dependências": "Dependencies",
  "Dependência circular detectada": "Circular dependency detected",
  "Conflito de datas": "Date conflict",
  "· Conflito de datas": "· Date conflict",
  "· Em destaque": "· Highlighted",
  "Puxe esta bolinha para conectar uma dependência":
    "Drag this handle to connect a dependency",
  "Arraste a aresta esquerda para alterar a data de início":
    "Drag the left edge to change the start date",
  "Arraste a aresta direita para alterar a data de término":
    "Drag the right edge to change the end date",
  "Remover dependência": "Remove dependency",
  "Remover dependência?": "Remove dependency?",
  "Rede PERT (AON)": "PERT Network (AON)",
  Marco: "Milestone",
  Marcos: "Milestones",
  "Marcos do cronograma": "Schedule milestones",
  "Novo marco": "New milestone",
  "Adicionar novo marco": "Add new milestone",
  "Adicionar etapa": "Add step",
  "Data / Semana do marco": "Milestone Date / Week",
  "Critérios de aceitação": "Acceptance criteria",
  "(critérios de aceitação)": "(acceptance criteria)",
  "Escopo ou contexto da revisão deste marco":
    "Scope or review context for this milestone",
  "Evidência coletada na revisão": "Evidence collected in the review",
  "Percentual de tarefas aprovadas no marco":
    "Percentage of tasks approved at the milestone",
  Caminho: "Path",
  "Novo caminho": "New path",
  "Editar caminho": "Edit path",
  "Nome do caminho": "Path name",
  "Sequência do caminho": "Path sequence",
  "Caminho salvo": "Saved path",
  "Caminho incompleto": "Incomplete path",
  "Destacar no Gantt": "Highlight in Gantt",
  "Motivo do risco": "Risk reason",
  "Risco de atraso (Atenção)": "Delay risk (Attention)",
  "Vincule pelo menos duas tarefas antes de criar um caminho.":
    "Link at least two tasks before creating a path.",
  "Há ligações ausentes. Remova as etapas a partir da primeira ligação ausente para reconstruir a sequência.":
    "There are missing links. Remove steps starting from the first missing link to rebuild the sequence.",
  "Legenda RACI": "RACI Legend",
  "R — Executores (Responsáveis)": "R — Responsible (Executors)",
  "A — Atribuído por:": "A — Accountable:",
  "C — Consultados": "C — Consulted",
  "I — Informados": "I — Informed",
  "Responde pela entrega": "Accountable for delivery",
  "Responsável (Alocação)": "Owner (Allocation)",
  "Responsável Técnico": "Technical Owner",
  Executa: "Executes",
  Consultado: "Consulted",
  Informado: "Informed",
  "Sem executor": "No executor",
  "Sem responsável": "No owner",
  "Não atribuído": "Unassigned",
  Pendentes: "Pending",
  Concluídas: "Completed",
  Concluídos: "Completed",
  Crítica: "Critical",
  Atenção: "Attention",
  "Atenção:": "Attention:",

  // Gestão de Riscos
  "Carregando riscos": "Loading risks",
  "Plano Cartesiano de Riscos (Probabilidade por Consequência)":
    "Risk Cartesian Matrix (Probability vs. Consequence)",
  "Distribuição por Chance (%)": "Distribution by Probability (%)",
  "Distribuição por Consequência (%)": "Distribution by Consequence (%)",
  Chance: "Probability",
  "Probabilidade de ocorrer": "Probability of occurring",
  Consequência: "Consequence",
  "Consequência de ocorrência": "Consequence if it occurs",
  Risco: "Risk",
  "Buscar risco...": "Search risk...",
  "Buscar risco ou observação": "Search risk or note",
  "Nenhum risco cadastrado": "No risks registered",
  "Cadastre riscos ou oportunidades para acompanhar chances, consequências e planos de contingência.":
    "Register risks or opportunities to track probabilities, consequences, and contingency plans.",
  "Descreva a evolução, eficácia da estratégia proativa ou ação tomada":
    "Describe progress, effectiveness of the proactive strategy, or action taken",
  "Ações preventivas ou de aproveitamento": "Preventive or opportunity actions",
  "Revisão & Histórico": "Review & History",

  // WBS / Documentos
  "Árvore do Escopo (WBS / EAP)": "Scope Tree (WBS)",
  "Árvore do Escopo (EAP)": "Scope Tree (WBS)",
  "Árvore (Canvas)": "Tree (Canvas)",
  Tabela: "Table",
  "Visualização em Árvore Interativa (Canvas)": "Interactive Tree View (Canvas)",
  "Visualização em Canvas Interativo": "Interactive Canvas View",
  "Visualização em Tabela Tabular": "Tabular Table View",
  "Ajustar à Tela": "Fit to Screen",
  "Ajustar à Tela (Fit View)": "Fit View",
  "Diminuir Zoom": "Zoom Out",
  "Diminuir Zoom (-)": "Zoom Out (-)",
  "Aumentar Zoom": "Zoom In",
  "Aumentar Zoom (+)": "Zoom In (+)",
  "Redefinir visualização (100%)": "Reset view (100%)",
  "Resetar Vista e Zoom": "Reset View & Zoom",
  "Nível de Zoom": "Zoom Level",
  "Exportar WBS em PDF": "Export WBS as PDF",
  "Mapa em Árvore Hierárquica da WBS": "Hierarchical WBS Tree Map",
  "Opções e Configurações do Canvas": "Canvas Options & Settings",
  "Ativar modo de leitura limpa para banca de Project Management":
    "Enable clean reading mode for the Project Management judging panel",
  "Modo Juízes / Apresentação": "Judges / Presentation Mode",
  Juízes: "Judges",
  "Projeto STEM Racing (100%)": "STEM Racing Project (100%)",
  "Novo Entregável": "New Deliverable",
  "Editar Entregável": "Edit Deliverable",
  "Criar Primeiro Entregável Raiz": "Create First Root Deliverable",
  "Adicionar no Mesmo Nível": "Add at Same Level",
  "Adicionar no Mesmo Nível (Ao Lado)": "Add at Same Level (Sibling)",
  "Adicionar sub-entregável": "Add sub-deliverable",
  "Adicionar Sub-entregável": "Add Sub-deliverable",
  "Adicionar sub-entregável via modal": "Add sub-deliverable via modal",
  "Adicionar Subordinado": "Add Subordinate",
  "Adicionar Subordinado (Abaixo)": "Add Subordinate (Below)",
  "Código EAP & Entregável": "WBS Code & Deliverable",
  "Buscar entregável por código EAP, nome ou responsável...":
    "Search deliverable by WBS code, name, or owner...",
  "Nenhum (Entregável Raiz)": "None (Root Deliverable)",
  "Nenhum (Definir depois)": "None (Set later)",
  "Entregáveis Totais": "Total Deliverables",
  "Entregáveis finalizados": "Completed deliverables",
  "Esforço Estimado": "Estimated Effort",
  Horas: "Hours",
  "Horas estimadas": "Estimated hours",
  Disciplina: "Discipline",

  // Comunicação & Stakeholders
  "Métricas Principais de Comunicação": "Key Communication Metrics",
  "Comunicações Enviadas": "Communications Sent",
  "Stakeholders Mapeados": "Mapped Stakeholders",
  "Stakeholder Cadastrado": "Stakeholder Registered",
  "Stakeholder / Empresa": "Stakeholder / Company",
  "Novo Stakeholder": "New Stakeholder",
  "Editar Stakeholder": "Edit Stakeholder",
  "Remover Stakeholder": "Remove Stakeholder",
  "Cadastrar Primeiro Stakeholder": "Register First Stakeholder",
  "Cadastrar Stakeholder no Mapa Hierárquico":
    "Register Stakeholder in Hierarchy Map",
  "Organograma de Poder & Interesse": "Power & Interest Org Chart",
  "Mapa Global de Parceiros": "Global Partner Map",
  "Matriz de Comunicação (Tabela)": "Communication Matrix (Table)",
  "Abrir no Gerador de Relatórios": "Open in Report Generator",
  "Buscar no mapa de stakeholders": "Search in stakeholder map",
  "Buscar parceiro, cargo ou pessoa...": "Search partner, role, or person...",
  "Nome do Stakeholder *": "Stakeholder Name *",
  "Parte Interessada": "Stakeholder",
  "Parte Interessada (Stakeholder) *": "Stakeholder *",
  "Destinatário (Stakeholder) *": "Recipient (Stakeholder) *",
  "Nome do Destinatário": "Recipient Name",
  "Organização *": "Organization *",
  "Escola / Instituição / Escuderia": "School / Institution / Team",
  "Grupo Institucional *": "Institutional Group *",
  "Contato / Ponto Focal (Opcional)": "Contact / Focal Point (Optional)",
  "WhatsApp (opcional)": "WhatsApp (optional)",
  "E-mail (opcional)": "Email (optional)",
  "E-mail Corporativo": "Corporate Email",
  "E-mail de Envio da Equipe": "Team Sender Email",
  "Canal Oficial": "Official Channel",
  "Canal Preferencial": "Preferred Channel",
  "Canal Utilizado": "Channel Used",
  "Canal / Frequência": "Channel / Frequency",
  "Frequência da Régua": "Cadence Frequency",
  "Poder sobre o Projeto": "Power over Project",
  "Poder / Interesse": "Power / Interest",
  "Nível de Interesse": "Interest Level",
  Engajamento: "Engagement",
  "Índice de Engajamento": "Engagement Index",
  "Transição de Engajamento": "Engagement Transition",
  "Percepção / Sentimento do Stakeholder":
    "Stakeholder Perception / Sentiment",
  "Calendário de Agendamentos Automáticos": "Automated Schedule Calendar",
  "Agendamentos do Dia": "Schedules for the Day",
  "Registrar Interação": "Log Interaction",
  "Gerar Relatório": "Generate Report",
  "Selecionar formato do relatório": "Select report format",
  "Módulo de Dados a Incluir": "Data Module to Include",
  "Assunto do E-mail": "Email Subject",
  "Corpo do E-mail": "Email Body",
  "Nenhum registro de comunicação ainda.": "No communication logs yet.",
  "Nenhum relatório compilado ainda.": "No compiled reports yet.",
  "Nenhum stakeholder encontrado.": "No stakeholder found.",

  // ROI & Patrocinadores
  "Indicadores de Retorno sobre Investimento":
    "Return on Investment Indicators",
  "Indicadores de Ações de Retorno": "Return Action Indicators",
  "Nova Empresa Patrocinadora": "New Sponsor Company",
  "Empresa Patrocinadora": "Sponsor Company",
  "Empresa Patrocinadora Beneficiada": "Benefited Sponsor Company",
  "Cota de Patrocínio": "Sponsorship Tier",
  "Valor investido proposto:": "Proposed invested amount:",
  "Registrar Ação de Retorno": "Record Return Action",
  "Registrar Retorno": "Record Return",
  "Tipo de Ativação": "Activation Type",
  "Tipo de Ativação / Ação": "Activation / Action Type",
  "Título / Descrição da Ação": "Action Title / Description",
  "Data de Realização": "Completion Date",
  "Alcance / Público (Opcional)": "Reach / Audience (Optional)",
  "Visualizações ou público presente": "Views or attendees reached",
  "Valoração de ativações:": "Activations valuation:",
  "Valoração de mídia (Alcance):": "Media valuation (Reach):",
  "Valor de Retorno Gerado (R$)": "Generated Return Value (R$)",
  "Evidência / Detalhes (Opcional)": "Evidence / Details (Optional)",
  "Contrapartidas & Observações (Opcional)":
    "Deliverables & Notes (Optional)",
  "Buscar por título ou descrição...": "Search by title or description...",
  "Buscar por título, empresa ou evidência...":
    "Search by title, company, or evidence...",
  "Nenhuma empresa patrocinadora encontrada": "No sponsor company found",
  "Nenhuma ação de retorno encontrada": "No return action found",

  // Equipe, Integrantes e Permissões
  "+ Nova Equipe": "+ New Team",
  "Criar Equipe + 5 Setores": "Create Team + 5 Sectors",
  "Cadastrar Nova Equipe na Plataforma": "Register New Team on Platform",
  "Excluir Equipe": "Delete Team",
  "Excluir equipe permanentemente": "Permanently delete team",
  "+ Cadastrar Integrante": "+ Add Member",
  "Cadastrar Integrante": "Add Member",
  "Cadastrar Novo Integrante na Plataforma": "Register New Member on Platform",
  "Excluir Integrante": "Remove Member",
  "Equipe (Isolamento Multi-Equipe)": "Team (Multi-Team Isolation)",
  "Nome do novo grupo...": "New group name...",
  "Permissão na Plataforma": "Platform Permission",
  Permissão: "Permission",
  "Permissão (RBAC)": "Permission (RBAC)",
  "Status da Conta": "Account Status",
  Ativo: "Active",
  Inativo: "Inactive",
  Estado: "State",
  Autorizado: "Authorized",
  "Não Autorizado": "Unauthorized",
  "Redefinir Senha": "Reset Password",
  "Nova Senha": "New Password",
  "Confirmar Nova Senha": "Confirm New Password",
  "Senha Inicial": "Initial Password",
  "Mínimo 8 caracteres...": "Minimum 8 characters...",
  "Repita a nova senha...": "Repeat new password...",
  "Matriz de Acessos por Módulo": "Module Access Matrix",
  "Liberar Todos os Módulos (SIM)": "Grant All Modules (YES)",
  "Restringir Operacionais (NÃO)": "Restrict Operational Modules (NO)",
  "Política de Segurança Ativa": "Active Security Policy",
  "Buscar integrante...": "Search member...",
  "Buscar integrante ou setor...": "Search member or sector...",
  "Buscar integrante por nome ou e-mail": "Search member by name or email",
  "Buscar integrante por nome, e-mail ou cargo...":
    "Search member by name, email, or role...",
  "Não há integrantes cadastrados para os filtros aplicados.":
    "No members registered for the applied filters.",
  "Nenhum integrante encontrado": "No member found",
  "Nenhum outro integrante restante.": "No other members remaining.",
  "Nenhum evento registrado": "No events logged",
  "Nenhum evento de segurança registrado até o momento.":
    "No security events logged yet.",
  "Nenhum registro encontrado para os filtros aplicados":
    "No records found for the applied filters",
  "Ajuste ou limpe os filtros para visualizar os registros.":
    "Adjust or clear the filters to view records.",
  "Sem Equipe": "No Team",
  "Sem login recente": "No recent login",

  // Misc comuns
  Sim: "Yes",
  Não: "No",
  SIM: "YES",
  NÃO: "NO",
  "Melhoria Contínua": "Continuous Improvement",
  "Registro de evidência de gestão": "Management evidence record",
  "Remover daqui": "Remove from here",
  "Excluir registro": "Delete record",
  Período: "Period",
  Formato: "Format",
  Prazo: "Deadline",
  itens: "items",
  item: "item",
  dias: "days",
  dia: "day",
  horas: "hours",
  hora: "hour",
};

const ENTITY_PLURAL_TO_EN: Readonly<Record<string, string>> = {
  lançamentos: "transactions",
  recursos: "resources",
  integrantes: "members",
  equipes: "teams",
  registros: "records",
  riscos: "risks",
  ações: "actions",
  patrocinadores: "sponsors",
  stakeholders: "stakeholders",
  eventos: "events",
  tarefas: "tasks",
  atividades: "activities",
  usuários: "users",
  entregáveis: "deliverables",
};

const EDIT_OR_DELETE_TARGETS_TO_EN: Readonly<Record<string, string>> = {
  equipe: "team",
  integrante: "member",
  lançamento: "transaction",
  recurso: "resource",
  registro: "record",
  tarefa: "task",
  caminho: "path",
  stakeholder: "stakeholder",
  entregável: "deliverable",
  marco: "milestone",
  risco: "risk",
  empresa: "company",
  ação: "action",
};

interface TranslationPattern {
  regex: RegExp;
  replace: (match: RegExpExecArray) => string;
}

const PT_TO_EN_PATTERNS: readonly TranslationPattern[] = [
  {
    regex: /^Mostrando\s+(\d+)-(\d+)\s+de\s+(\d+)\s+([A-Za-zÀ-ÿ_-]+)$/i,
    replace: (m) => {
      const entityPt = m[4].toLowerCase();
      const entityEn = ENTITY_PLURAL_TO_EN[entityPt] ?? m[4];
      return `Showing ${m[1]}-${m[2]} of ${m[3]} ${entityEn}`;
    },
  },
  {
    regex: /^Página\s+(\d+)\s+de\s+(\d+)$/i,
    replace: (m) => `Page ${m[1]} of ${m[2]}`,
  },
  {
    regex: /^Ações para\s+(.+)$/i,
    replace: (m) => `Actions for ${m[1]}`,
  },
  {
    regex: /^•\s*Setor:\s*(.+)$/i,
    replace: (m) => {
      const sector = PT_TO_EN_DICTIONARY[m[1].trim()] ?? m[1].trim();
      return `• Sector: ${sector}`;
    },
  },
  {
    regex: /^Setor:\s*(.+)$/i,
    replace: (m) => {
      const sector = PT_TO_EN_DICTIONARY[m[1].trim()] ?? m[1].trim();
      return `Sector: ${sector}`;
    },
  },
  {
    regex: /^Semana\s+(\d+)$/i,
    replace: (m) => `Week ${m[1]}`,
  },
  {
    regex: /^Mês\s+(\d+)$/i,
    replace: (m) => `Month ${m[1]}`,
  },
  {
    regex: /^Temporada\s+(.+)$/i,
    replace: (m) => `Season ${m[1]}`,
  },
  {
    regex: /^(\d+)\s+itens$/i,
    replace: (m) => `${m[1]} items`,
  },
  {
    regex: /^1\s+item$/i,
    replace: () => "1 item",
  },
  {
    regex: /^(\d+)\s+dias$/i,
    replace: (m) => `${m[1]} days`,
  },
  {
    regex: /^1\s+dia$/i,
    replace: () => "1 day",
  },
  {
    regex: /^(\d+)\s+horas$/i,
    replace: (m) => `${m[1]} hours`,
  },
  {
    regex: /^1\s+hora$/i,
    replace: () => "1 hour",
  },
  {
    regex: /^Editar\s+(.+)$/,
    replace: (m) => {
      const key = m[1].trim().toLowerCase();
      const target = EDIT_OR_DELETE_TARGETS_TO_EN[key];
      if (!target) {
        return `Edit ${m[1].trim()}`;
      }
      const isCapitalized =
        m[1].trim().charAt(0) === m[1].trim().charAt(0).toUpperCase();
      const formatted = isCapitalized
        ? `${target.charAt(0).toUpperCase()}${target.slice(1)}`
        : target;
      return `Edit ${formatted}`;
    },
  },
  {
    regex: /^Excluir\s+(.+)$/,
    replace: (m) => {
      const key = m[1].trim().toLowerCase();
      const target = EDIT_OR_DELETE_TARGETS_TO_EN[key];
      if (!target) {
        return `Delete ${m[1].trim()}`;
      }
      const isCapitalized =
        m[1].trim().charAt(0) === m[1].trim().charAt(0).toUpperCase();
      const formatted = isCapitalized
        ? `${target.charAt(0).toUpperCase()}${target.slice(1)}`
        : target;
      return `Delete ${formatted}`;
    },
  },
];

function lookupExactWithOptionalSuffix(normalizedCore: string): string | null {
  const directMatch = PT_TO_EN_DICTIONARY[normalizedCore];
  if (directMatch !== undefined) {
    return directMatch;
  }

  if (normalizedCore.endsWith(":")) {
    const base = normalizedCore.slice(0, -1).trim();
    const baseMatch = PT_TO_EN_DICTIONARY[base];
    if (baseMatch !== undefined) {
      return `${baseMatch}:`;
    }
  }

  if (normalizedCore.endsWith(" *")) {
    const base = normalizedCore.slice(0, -2).trim();
    const baseMatch = PT_TO_EN_DICTIONARY[base];
    if (baseMatch !== undefined) {
      return `${baseMatch} *`;
    }
  }

  return null;
}

export function translateUiText(raw: string, locale: AppLocale): string {
  if (locale === "pt-BR" || !raw) {
    return raw;
  }

  const boundaryMatch = /^(\s*)([\s\S]*?)(\s*)$/.exec(raw);
  if (!boundaryMatch) {
    return raw;
  }

  const leadingSpace = boundaryMatch[1];
  const core = boundaryMatch[2];
  const trailingSpace = boundaryMatch[3];

  if (!core) {
    return raw;
  }

  const normalizedCore = core.replace(/\s+/g, " ");

  const exact = lookupExactWithOptionalSuffix(normalizedCore);
  if (exact !== null) {
    return `${leadingSpace}${exact}${trailingSpace}`;
  }

  for (const pattern of PT_TO_EN_PATTERNS) {
    const match = pattern.regex.exec(normalizedCore);
    if (match) {
      return `${leadingSpace}${pattern.replace(match)}${trailingSpace}`;
    }
  }

  return raw;
}
