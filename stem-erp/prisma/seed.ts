import {
  PrismaClient,
  DeliveryGroup,
  AcquisitionStrategy,
  TransactionType,
  TrackingMethod,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const DEFAULT_SECTOR_CATEGORIES: Array<{
  name: string;
  deliveryGroup: DeliveryGroup;
}> = [
  { name: "Softwares & Licenças CAD/CFD", deliveryGroup: DeliveryGroup.ENGINEERING_CAD },
  { name: "Prototipagem Rápida & Impressão 3D", deliveryGroup: DeliveryGroup.ENGINEERING_CAD },
  { name: "Blocos Poliuretano", deliveryGroup: DeliveryGroup.MANUFACTURING_CNC },
  { name: "Usinagem CNC", deliveryGroup: DeliveryGroup.MANUFACTURING_CNC },
  { name: "Rolamentos & Componentes Mecânicos", deliveryGroup: DeliveryGroup.MANUFACTURING_CNC },
  { name: "Pintura Automotiva & Acabamento", deliveryGroup: DeliveryGroup.MANUFACTURING_CNC },
  { name: "Estande MDF", deliveryGroup: DeliveryGroup.PIT_DISPLAY },
  { name: "Iluminação & Telas Interativas", deliveryGroup: DeliveryGroup.PIT_DISPLAY },
  { name: "Uniformes", deliveryGroup: DeliveryGroup.MARKETING_SPONSOR },
  { name: "Material Gráfico & Brindes", deliveryGroup: DeliveryGroup.MARKETING_SPONSOR },
  { name: "Patrocínio Ouro", deliveryGroup: DeliveryGroup.MARKETING_SPONSOR },
  { name: "Patrocínio Prata", deliveryGroup: DeliveryGroup.MARKETING_SPONSOR },
  { name: "Permuta / Apoio Técnico", deliveryGroup: DeliveryGroup.MARKETING_SPONSOR },
  { name: "Inscrição", deliveryGroup: DeliveryGroup.PROJECT_MANAGEMENT },
  { name: "Logística & Hospedagem", deliveryGroup: DeliveryGroup.PROJECT_MANAGEMENT },
];

async function ensureTeamCategories(teamId: string): Promise<Map<string, string>> {
  const categoryMap = new Map<string, string>();
  for (const cat of DEFAULT_SECTOR_CATEGORIES) {
    const upserted = await prisma.category.upsert({
      where: {
        teamId_name: {
          teamId,
          name: cat.name,
        },
      },
      update: { deliveryGroup: cat.deliveryGroup },
      create: {
        teamId,
        name: cat.name,
        deliveryGroup: cat.deliveryGroup,
      },
    });
    categoryMap.set(cat.name, upserted.id);
  }
  return categoryMap;
}

async function main() {
  console.log("🌱 Iniciando seed Multi-Equipe do STEM Racing Financial & Resource ERP...");

  // 1. Criar as Equipes: Equipe Gênesis e Equipe Alpha
  const genesisTeam = await prisma.team.upsert({
    where: { slug: "equipe-genesis" },
    update: { name: "Equipe Gênesis", isActive: true },
    create: {
      name: "Equipe Gênesis",
      slug: "equipe-genesis",
      schoolOrOrg: "Escuderia Gênesis STEM Racing",
      isActive: true,
    },
  });

  const alphaTeam = await prisma.team.upsert({
    where: { slug: "equipe-alpha" },
    update: { name: "Equipe Alpha", isActive: true },
    create: {
      name: "Equipe Alpha",
      slug: "equipe-alpha",
      schoolOrOrg: "Alpha Motorsport Academy",
      isActive: true,
    },
  });

  console.log("✅ Equipes criadas: Equipe Gênesis e Equipe Alpha.");

  // 2. Criar categorias de todos os setores para cada Equipe
  const genesisCats = await ensureTeamCategories(genesisTeam.id);
  const alphaCats = await ensureTeamCategories(alphaTeam.id);

  // 3. Seed de Usuários (SuperAdmin + Integrantes da Equipe Gênesis + Integrantes da Equipe Alpha)
  const defaultPasswordHash = await bcrypt.hash("Genesis@2026", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@genesisracing.com" },
    update: {
      role: UserRole.SUPER_ADMIN,
      teamId: genesisTeam.id,
      isActive: true,
    },
    create: {
      name: "SuperAdmin Plataforma",
      email: "superadmin@genesisracing.com",
      passwordHash: defaultPasswordHash,
      role: UserRole.SUPER_ADMIN,
      teamId: genesisTeam.id,
      deliveryGroup: DeliveryGroup.PROJECT_MANAGEMENT,
      jobTitle: "Administrador Global STEM",
      isActive: true,
    },
  });

  const sampleUsers = [
    // Integrantes da Equipe Gênesis
    {
      name: "Lucas Mendes (Gênesis)",
      email: "lucas@genesisracing.com",
      role: UserRole.TEAM_LEAD,
      teamId: genesisTeam.id,
      deliveryGroup: DeliveryGroup.MANUFACTURING_CNC,
      jobTitle: "Líder de Manufatura & CNC",
    },
    {
      name: "Sofia Albuquerque (Gênesis)",
      email: "sofia@genesisracing.com",
      role: UserRole.TEAM_LEAD,
      teamId: genesisTeam.id,
      deliveryGroup: DeliveryGroup.ENGINEERING_CAD,
      jobTitle: "Engenheira Chefe CAD/CFD",
    },
    {
      name: "Beatriz Costa (Gênesis)",
      email: "beatriz@genesisracing.com",
      role: UserRole.FINANCE_MANAGER,
      teamId: genesisTeam.id,
      deliveryGroup: DeliveryGroup.MARKETING_SPONSOR,
      jobTitle: "Diretora Financeira & Marketing",
    },
    // Integrantes da Equipe Alpha
    {
      name: "Carlos Eduardo (Alpha)",
      email: "carlos@alpharacing.com",
      role: UserRole.FINANCE_MANAGER,
      teamId: alphaTeam.id,
      deliveryGroup: DeliveryGroup.PROJECT_MANAGEMENT,
      jobTitle: "Team Principal & Finanças Alpha",
    },
    {
      name: "Marina Santos (Alpha)",
      email: "marina@alpharacing.com",
      role: UserRole.TEAM_LEAD,
      teamId: alphaTeam.id,
      deliveryGroup: DeliveryGroup.ENGINEERING_CAD,
      jobTitle: "Líder de Aerodinâmica Alpha",
    },
  ];

  for (const u of sampleUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        teamId: u.teamId,
        role: u.role,
        deliveryGroup: u.deliveryGroup,
        jobTitle: u.jobTitle,
      },
      create: {
        ...u,
        passwordHash: defaultPasswordHash,
        isActive: true,
        createdById: superAdmin.id,
      },
    });
  }

  console.log("✅ SuperAdmin e integrantes da Equipe Gênesis e Equipe Alpha sincronizados.");

  // 4. Dados Financeiros da Equipe Gênesis
  const genesisBudgetCount = await prisma.budgetResource.count({
    where: { teamId: genesisTeam.id },
  });

  if (genesisBudgetCount === 0) {
    const genesisBudgets = [
      {
        teamId: genesisTeam.id,
        code: "ORC-001",
        deliveryGroup: DeliveryGroup.PROJECT_MANAGEMENT,
        categoryId: genesisCats.get("Inscrição")!,
        resourceName: "Taxa de Inscrição Nacional STEM Racing",
        acquisitionStrategy: AcquisitionStrategy.FINANCIAL_SPONSOR,
        allocatedTo: "Beatriz Costa",
        plannedMonth: 1,
        utilizationForecast: 100,
        plannedAmountCents: 180000,
      },
      {
        teamId: genesisTeam.id,
        code: "ORC-002",
        deliveryGroup: DeliveryGroup.ENGINEERING_CAD,
        categoryId: genesisCats.get("Prototipagem Rápida & Impressão 3D")!,
        resourceName: "Filamento fibra de carbono para asas dianteira/traseira",
        acquisitionStrategy: AcquisitionStrategy.DIRECT_PURCHASE,
        allocatedTo: "Sofia Albuquerque",
        plannedMonth: 2,
        utilizationForecast: 85,
        plannedAmountCents: 65000,
      },
      {
        teamId: genesisTeam.id,
        code: "ORC-003",
        deliveryGroup: DeliveryGroup.MANUFACTURING_CNC,
        categoryId: genesisCats.get("Blocos Poliuretano")!,
        resourceName: "Kit 6 Blocos de Poliuretano Oficial STEM Racing",
        acquisitionStrategy: AcquisitionStrategy.DIRECT_PURCHASE,
        allocatedTo: "Lucas Mendes",
        plannedMonth: 2,
        utilizationForecast: 100,
        plannedAmountCents: 120000,
      },
      {
        teamId: genesisTeam.id,
        code: "ORC-004",
        deliveryGroup: DeliveryGroup.MANUFACTURING_CNC,
        categoryId: genesisCats.get("Usinagem CNC")!,
        resourceName: "Horas de Centro de Usinagem CNC 4 Eixos",
        acquisitionStrategy: AcquisitionStrategy.BARTER_PARTNERSHIP,
        allocatedTo: "Lucas Mendes",
        plannedMonth: 3,
        utilizationForecast: 95,
        plannedAmountCents: 150000,
      },
      {
        teamId: genesisTeam.id,
        code: "ORC-005",
        deliveryGroup: DeliveryGroup.MANUFACTURING_CNC,
        categoryId: genesisCats.get("Rolamentos & Componentes Mecânicos")!,
        resourceName: "Rolamentos Cerâmicos Híbridos ABEC-9",
        acquisitionStrategy: AcquisitionStrategy.DIRECT_PURCHASE,
        allocatedTo: "Lucas Mendes",
        plannedMonth: 3,
        utilizationForecast: 100,
        plannedAmountCents: 80000,
      },
      {
        teamId: genesisTeam.id,
        code: "ORC-006",
        deliveryGroup: DeliveryGroup.PIT_DISPLAY,
        categoryId: genesisCats.get("Estande MDF")!,
        resourceName: "Estrutura Modular em MDF Naval + Corte Laser",
        acquisitionStrategy: AcquisitionStrategy.FINANCIAL_SPONSOR,
        allocatedTo: "Coordenador Pit Display",
        plannedMonth: 4,
        utilizationForecast: 90,
        plannedAmountCents: 220000,
      },
      {
        teamId: genesisTeam.id,
        code: "ORC-007",
        deliveryGroup: DeliveryGroup.MARKETING_SPONSOR,
        categoryId: genesisCats.get("Uniformes")!,
        resourceName: "Camisas Oficiais Dry-Fit e Jaquetas de Paddock (8 un)",
        acquisitionStrategy: AcquisitionStrategy.OWN_FUNDS_RAFFLE,
        allocatedTo: "Beatriz Costa",
        plannedMonth: 5,
        utilizationForecast: 100,
        plannedAmountCents: 110000,
      },
      {
        teamId: genesisTeam.id,
        code: "ORC-008",
        deliveryGroup: DeliveryGroup.PROJECT_MANAGEMENT,
        categoryId: genesisCats.get("Logística & Hospedagem")!,
        resourceName: "Transporte e Credenciamento Etapa Nacional",
        acquisitionStrategy: AcquisitionStrategy.FINANCIAL_SPONSOR,
        allocatedTo: "Beatriz Costa",
        plannedMonth: 6,
        utilizationForecast: 100,
        plannedAmountCents: 250000,
      },
    ];

    const createdGenesisBudgets = [];
    for (const item of genesisBudgets) {
      const created = await prisma.budgetResource.create({ data: item });
      createdGenesisBudgets.push(created);
    }

    await prisma.transaction.createMany({
      data: [
        {
          teamId: genesisTeam.id,
          date: new Date("2026-05-05T10:00:00Z"),
          referenceMonth: 1,
          type: TransactionType.ORIGIN,
          deliveryGroup: DeliveryGroup.MARKETING_SPONSOR,
          categoryId: genesisCats.get("Patrocínio Ouro")!,
          description: "Aporte Patrocínio Ouro - Agenesis Tech Corp (1ª Parcela)",
          trackingMethod: TrackingMethod.SPONSOR_CONTRACT,
          documentRef: "CONT-GEN-001",
          amountCents: 500000,
        },
        {
          teamId: genesisTeam.id,
          date: new Date("2026-05-12T14:30:00Z"),
          referenceMonth: 1,
          type: TransactionType.APPLICATION,
          deliveryGroup: DeliveryGroup.PROJECT_MANAGEMENT,
          categoryId: genesisCats.get("Inscrição")!,
          budgetResourceId: createdGenesisBudgets[0].id,
          description: "Pagamento Inscrição Nacional STEM Racing (Equipe Gênesis)",
          trackingMethod: TrackingMethod.BANK_PIX_STATEMENT,
          documentRef: "PIX-GEN-8910",
          amountCents: 180000,
        },
        {
          teamId: genesisTeam.id,
          date: new Date("2026-06-08T11:15:00Z"),
          referenceMonth: 2,
          type: TransactionType.APPLICATION,
          deliveryGroup: DeliveryGroup.ENGINEERING_CAD,
          categoryId: genesisCats.get("Prototipagem Rápida & Impressão 3D")!,
          budgetResourceId: createdGenesisBudgets[1].id,
          description: "Compra de Filamento PAHT-CF15 e Bicos Endurecidos",
          trackingMethod: TrackingMethod.NFE,
          documentRef: "NFe-0004921",
          amountCents: 62000,
        },
        {
          teamId: genesisTeam.id,
          date: new Date("2026-06-18T16:00:00Z"),
          referenceMonth: 2,
          type: TransactionType.APPLICATION,
          deliveryGroup: DeliveryGroup.MANUFACTURING_CNC,
          categoryId: genesisCats.get("Blocos Poliuretano")!,
          budgetResourceId: createdGenesisBudgets[2].id,
          description: "Aquisição Lote Oficial Blocos Modelagem",
          trackingMethod: TrackingMethod.NFE,
          documentRef: "NFe-0019283",
          amountCents: 120000,
        },
        {
          teamId: genesisTeam.id,
          date: new Date("2026-07-04T09:00:00Z"),
          referenceMonth: 3,
          type: TransactionType.ORIGIN,
          deliveryGroup: DeliveryGroup.MARKETING_SPONSOR,
          categoryId: genesisCats.get("Permuta / Apoio Técnico")!,
          budgetResourceId: createdGenesisBudgets[3].id,
          description: "[PERMUTA - ORIGEM] Parceria Técnica SENAI Usinagem CNC",
          trackingMethod: TrackingMethod.SPONSOR_CONTRACT,
          documentRef: "PARC-SENAI-03",
          amountCents: 150000,
        },
        {
          teamId: genesisTeam.id,
          date: new Date("2026-07-04T09:05:00Z"),
          referenceMonth: 3,
          type: TransactionType.APPLICATION,
          deliveryGroup: DeliveryGroup.MANUFACTURING_CNC,
          categoryId: genesisCats.get("Usinagem CNC")!,
          budgetResourceId: createdGenesisBudgets[3].id,
          description: "[PERMUTA - APLICAÇÃO] Usinagem CNC 4 Eixos de 3 Protótipos",
          trackingMethod: TrackingMethod.SPONSOR_CONTRACT,
          documentRef: "PARC-SENAI-03",
          amountCents: 150000,
        },
        {
          teamId: genesisTeam.id,
          date: new Date("2026-07-19T15:20:00Z"),
          referenceMonth: 3,
          type: TransactionType.APPLICATION,
          deliveryGroup: DeliveryGroup.MANUFACTURING_CNC,
          categoryId: genesisCats.get("Rolamentos & Componentes Mecânicos")!,
          budgetResourceId: createdGenesisBudgets[4].id,
          description: "Compra Rolamentos Cerâmicos de Baixo Atrito",
          trackingMethod: TrackingMethod.NFE,
          documentRef: "NFe-0083412",
          amountCents: 95000,
        },
        {
          teamId: genesisTeam.id,
          date: new Date("2026-08-03T10:00:00Z"),
          referenceMonth: 4,
          type: TransactionType.ORIGIN,
          deliveryGroup: DeliveryGroup.MARKETING_SPONSOR,
          categoryId: genesisCats.get("Patrocínio Prata")!,
          description: "Cota Patrocínio Prata - Metalúrgica Vanguarda",
          trackingMethod: TrackingMethod.SPONSOR_CONTRACT,
          documentRef: "CONT-2026-004",
          amountCents: 280000,
        },
        {
          teamId: genesisTeam.id,
          date: new Date("2026-08-15T17:45:00Z"),
          referenceMonth: 4,
          type: TransactionType.APPLICATION,
          deliveryGroup: DeliveryGroup.PIT_DISPLAY,
          categoryId: genesisCats.get("Estande MDF")!,
          budgetResourceId: createdGenesisBudgets[5].id,
          description: "Chapas MDF Naval + Corte CNC + LED Totem Pit Display",
          trackingMethod: TrackingMethod.NFE,
          documentRef: "NFe-0038190",
          amountCents: 210000,
        },
      ],
    });
  }

  // 5. Dados Financeiros da Equipe Alpha (totalmente independentes!)
  const alphaBudgetCount = await prisma.budgetResource.count({
    where: { teamId: alphaTeam.id },
  });

  if (alphaBudgetCount === 0) {
    const alphaBudgets = [
      {
        teamId: alphaTeam.id,
        code: "ORC-001",
        deliveryGroup: DeliveryGroup.PROJECT_MANAGEMENT,
        categoryId: alphaCats.get("Inscrição")!,
        resourceName: "[Alpha] Inscrição Regional & Credenciamento",
        acquisitionStrategy: AcquisitionStrategy.FINANCIAL_SPONSOR,
        allocatedTo: "Carlos Eduardo",
        plannedMonth: 1,
        utilizationForecast: 100,
        plannedAmountCents: 180000,
      },
      {
        teamId: alphaTeam.id,
        code: "ORC-002",
        deliveryGroup: DeliveryGroup.ENGINEERING_CAD,
        categoryId: alphaCats.get("Softwares & Licenças CAD/CFD")!,
        resourceName: "[Alpha] Cluster Simulação Aerodinâmica CFD Cloud",
        acquisitionStrategy: AcquisitionStrategy.BARTER_PARTNERSHIP,
        allocatedTo: "Marina Santos",
        plannedMonth: 2,
        utilizationForecast: 90,
        plannedAmountCents: 140000,
      },
      {
        teamId: alphaTeam.id,
        code: "ORC-003",
        deliveryGroup: DeliveryGroup.MANUFACTURING_CNC,
        categoryId: alphaCats.get("Blocos Poliuretano")!,
        resourceName: "[Alpha] Lote Blocos + Rodas em Alumínio 7075",
        acquisitionStrategy: AcquisitionStrategy.DIRECT_PURCHASE,
        allocatedTo: "Carlos Eduardo",
        plannedMonth: 3,
        utilizationForecast: 100,
        plannedAmountCents: 165000,
      },
      {
        teamId: alphaTeam.id,
        code: "ORC-004",
        deliveryGroup: DeliveryGroup.MARKETING_SPONSOR,
        categoryId: alphaCats.get("Uniformes")!,
        resourceName: "[Alpha] Kit Uniformes Equipe Alpha Motorsport",
        acquisitionStrategy: AcquisitionStrategy.FINANCIAL_SPONSOR,
        allocatedTo: "Marina Santos",
        plannedMonth: 4,
        utilizationForecast: 100,
        plannedAmountCents: 95000,
      },
    ];

    const createdAlphaBudgets = [];
    for (const item of alphaBudgets) {
      const created = await prisma.budgetResource.create({ data: item });
      createdAlphaBudgets.push(created);
    }

    await prisma.transaction.createMany({
      data: [
        {
          teamId: alphaTeam.id,
          date: new Date("2026-05-10T10:00:00Z"),
          referenceMonth: 1,
          type: TransactionType.ORIGIN,
          deliveryGroup: DeliveryGroup.MARKETING_SPONSOR,
          categoryId: alphaCats.get("Patrocínio Ouro")!,
          description: "[Alpha] Patrocínio Master - Alpha Motors S/A",
          trackingMethod: TrackingMethod.SPONSOR_CONTRACT,
          documentRef: "ALPHA-CONT-01",
          amountCents: 420000,
        },
        {
          teamId: alphaTeam.id,
          date: new Date("2026-05-15T14:00:00Z"),
          referenceMonth: 1,
          type: TransactionType.APPLICATION,
          deliveryGroup: DeliveryGroup.PROJECT_MANAGEMENT,
          categoryId: alphaCats.get("Inscrição")!,
          budgetResourceId: createdAlphaBudgets[0].id,
          description: "[Alpha] Pagamento Inscrição Regional STEM Racing",
          trackingMethod: TrackingMethod.BANK_PIX_STATEMENT,
          documentRef: "ALPHA-PIX-101",
          amountCents: 180000,
        },
        {
          teamId: alphaTeam.id,
          date: new Date("2026-06-20T11:30:00Z"),
          referenceMonth: 3,
          type: TransactionType.APPLICATION,
          deliveryGroup: DeliveryGroup.MANUFACTURING_CNC,
          categoryId: alphaCats.get("Blocos Poliuretano")!,
          budgetResourceId: createdAlphaBudgets[2].id,
          description: "[Alpha] Compra Blocos e Eixos de Titânio",
          trackingMethod: TrackingMethod.NFE,
          documentRef: "ALPHA-NFE-552",
          amountCents: 160000,
        },
      ],
    });
  }

  console.log("✅ Dados financeiros independentes para Equipe Gênesis e Equipe Alpha populados!");
}

main()
  .catch((error) => {
    console.error("❌ Erro no seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
