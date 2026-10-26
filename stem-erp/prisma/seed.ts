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
  console.log("🌱 Iniciando seed Multi-Equipe: Gênesis ZERADA e Alpha com dados...");

  // 1. Criar ou garantir as Equipes: Equipe Gênesis e Equipe Alpha
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

  console.log("✅ Equipes garantidas: Equipe Gênesis e Equipe Alpha.");

  // 2. Garantir categorias estruturais para ambas as equipes
  await ensureTeamCategories(genesisTeam.id);
  const alphaCats = await ensureTeamCategories(alphaTeam.id);

  // 3. LIMPEZA TOTAL DA EQUIPE GÊNESIS (deixar banco da Gênesis 100% zerado)
  await prisma.transaction.deleteMany({
    where: { teamId: genesisTeam.id },
  });
  await prisma.budgetResource.deleteMany({
    where: { teamId: genesisTeam.id },
  });
  await prisma.user.deleteMany({
    where: {
      teamId: genesisTeam.id,
      email: { not: "superadmin@genesisracing.com" },
    },
  });
  console.log("🧹 Equipe Gênesis 100% zerada (0 recursos, 0 transações, sem outros integrantes).");

  // 4. SuperAdmin único da plataforma
  const defaultPasswordHash = await bcrypt.hash("Genesis@2026", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@genesisracing.com" },
    update: {
      name: "SuperAdmin Plataforma",
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

  // 5. Integrantes da Equipe Alpha
  const alphaUsers = [
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

  for (const u of alphaUsers) {
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

  console.log("✅ SuperAdmin e integrantes da Equipe Alpha sincronizados.");

  // 6. Dados Financeiros da Equipe Alpha (orçamentos e lançamentos)
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
        resourceName: "Inscrição Regional & Credenciamento STEM Racing",
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
        resourceName: "Cluster de Simulação Aerodinâmica CFD Cloud",
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
        resourceName: "Lote Blocos Poliuretano + Rodas Alumínio 7075",
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
        resourceName: "Kit Uniformes Oficiais Equipe Alpha Motorsport",
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
          description: "Patrocínio Master - Alpha Motors S/A (1ª Parcela)",
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
          description: "Pagamento Inscrição Regional STEM Racing (Equipe Alpha)",
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
          description: "Compra Blocos e Eixos de Titânio de Alta Precisão",
          trackingMethod: TrackingMethod.NFE,
          documentRef: "ALPHA-NFE-552",
          amountCents: 160000,
        },
      ],
    });
  }

  console.log("✅ Dados da Equipe Alpha populados e prontos para teste!");
}

main()
  .catch((error) => {
    console.error("❌ Erro no seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
