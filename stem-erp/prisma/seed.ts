import { PrismaClient, DeliveryGroup, AcquisitionStrategy, TransactionType, TrackingMethod } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES: Array<{ name: string; deliveryGroup: DeliveryGroup }> = [
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

async function main() {
  console.log("🌱 Iniciando seed do STEM Racing Financial & Resource ERP...");

  const categoryMap = new Map<string, string>();

  for (const cat of DEFAULT_CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: { deliveryGroup: cat.deliveryGroup },
      create: {
        name: cat.name,
        deliveryGroup: cat.deliveryGroup,
      },
    });
    categoryMap.set(cat.name, created.id);
  }

  console.log(`✅ ${categoryMap.size} categorias padrão sincronizadas.`);

  const existingBudgetCount = await prisma.budgetResource.count();
  if (existingBudgetCount === 0) {
    const sampleBudgets = [
      {
        code: "ORC-001",
        deliveryGroup: DeliveryGroup.PROJECT_MANAGEMENT,
        categoryId: categoryMap.get("Inscrição")!,
        resourceName: "Taxa de Inscrição Nacional STEM Racing",
        acquisitionStrategy: AcquisitionStrategy.FINANCIAL_SPONSOR,
        allocatedTo: "Gerente de Projeto",
        plannedMonth: 1,
        utilizationForecast: 100,
        plannedAmountCents: 180000, // R$ 1.800,00
      },
      {
        code: "ORC-002",
        deliveryGroup: DeliveryGroup.ENGINEERING_CAD,
        categoryId: categoryMap.get("Prototipagem Rápida & Impressão 3D")!,
        resourceName: "Filamento fibra de carbono para asas dianteira/traseira",
        acquisitionStrategy: AcquisitionStrategy.DIRECT_PURCHASE,
        allocatedTo: "Líder de Engenharia CAD",
        plannedMonth: 2,
        utilizationForecast: 85,
        plannedAmountCents: 65000, // R$ 650,00
      },
      {
        code: "ORC-003",
        deliveryGroup: DeliveryGroup.MANUFACTURING_CNC,
        categoryId: categoryMap.get("Blocos Poliuretano")!,
        resourceName: "Kit 6 Blocos de Poliuretano Oficial STEM Racing",
        acquisitionStrategy: AcquisitionStrategy.DIRECT_PURCHASE,
        allocatedTo: "Líder de Manufatura",
        plannedMonth: 2,
        utilizationForecast: 100,
        plannedAmountCents: 120000, // R$ 1.200,00
      },
      {
        code: "ORC-004",
        deliveryGroup: DeliveryGroup.MANUFACTURING_CNC,
        categoryId: categoryMap.get("Usinagem CNC")!,
        resourceName: "Horas de Centro de Usinagem CNC 4 Eixos",
        acquisitionStrategy: AcquisitionStrategy.BARTER_PARTNERSHIP,
        allocatedTo: "Líder de Manufatura",
        plannedMonth: 3,
        utilizationForecast: 95,
        plannedAmountCents: 150000, // R$ 1.500,00
      },
      {
        code: "ORC-005",
        deliveryGroup: DeliveryGroup.MANUFACTURING_CNC,
        categoryId: categoryMap.get("Rolamentos & Componentes Mecânicos")!,
        resourceName: "Rolamentos Cerâmicos Híbridos ABEC-9",
        acquisitionStrategy: AcquisitionStrategy.DIRECT_PURCHASE,
        allocatedTo: "Engenheiro de Performance",
        plannedMonth: 3,
        utilizationForecast: 100,
        plannedAmountCents: 80000, // R$ 800,00
      },
      {
        code: "ORC-006",
        deliveryGroup: DeliveryGroup.PIT_DISPLAY,
        categoryId: categoryMap.get("Estande MDF")!,
        resourceName: "Estrutura Modular em MDF Naval + Corte Laser",
        acquisitionStrategy: AcquisitionStrategy.FINANCIAL_SPONSOR,
        allocatedTo: "Coordenador de Pit Display",
        plannedMonth: 4,
        utilizationForecast: 90,
        plannedAmountCents: 220000, // R$ 2.200,00
      },
      {
        code: "ORC-007",
        deliveryGroup: DeliveryGroup.MARKETING_SPONSOR,
        categoryId: categoryMap.get("Uniformes")!,
        resourceName: "Camisas Oficiais Dry-Fit e Jaquetas de Paddock (8 un)",
        acquisitionStrategy: AcquisitionStrategy.OWN_FUNDS_RAFFLE,
        allocatedTo: "Diretor de Marketing",
        plannedMonth: 5,
        utilizationForecast: 100,
        plannedAmountCents: 110000, // R$ 1.100,00
      },
      {
        code: "ORC-008",
        deliveryGroup: DeliveryGroup.PROJECT_MANAGEMENT,
        categoryId: categoryMap.get("Logística & Hospedagem")!,
        resourceName: "Transporte e Credenciamento Etapa Nacional",
        acquisitionStrategy: AcquisitionStrategy.FINANCIAL_SPONSOR,
        allocatedTo: "Gerente de Projeto",
        plannedMonth: 6,
        utilizationForecast: 100,
        plannedAmountCents: 250000, // R$ 2.500,00
      },
    ];

    const createdBudgets = [];
    for (const item of sampleBudgets) {
      const created = await prisma.budgetResource.create({ data: item });
      createdBudgets.push(created);
    }

    console.log(`✅ ${createdBudgets.length} recursos orçamentários previstos criados.`);

    const existingTxCount = await prisma.transaction.count();
    if (existingTxCount === 0) {
      await prisma.transaction.createMany({
        data: [
          {
            date: new Date("2026-05-05T10:00:00Z"),
            referenceMonth: 1,
            type: TransactionType.ORIGIN,
            deliveryGroup: DeliveryGroup.MARKETING_SPONSOR,
            categoryId: categoryMap.get("Patrocínio Ouro")!,
            description: "Aporte Patrocínio Ouro - Agenesis Tech Corp (1ª Parcela)",
            trackingMethod: TrackingMethod.SPONSOR_CONTRACT,
            documentRef: "CONT-2026-001",
            amountCents: 500000, // R$ 5.000,00
          },
          {
            date: new Date("2026-05-12T14:30:00Z"),
            referenceMonth: 1,
            type: TransactionType.APPLICATION,
            deliveryGroup: DeliveryGroup.PROJECT_MANAGEMENT,
            categoryId: categoryMap.get("Inscrição")!,
            budgetResourceId: createdBudgets[0].id,
            description: "Pagamento Inscrição Nacional STEM Racing",
            trackingMethod: TrackingMethod.BANK_PIX_STATEMENT,
            documentRef: "PIX-E8910234",
            amountCents: 180000, // R$ 1.800,00
          },
          {
            date: new Date("2026-06-08T11:15:00Z"),
            referenceMonth: 2,
            type: TransactionType.APPLICATION,
            deliveryGroup: DeliveryGroup.ENGINEERING_CAD,
            categoryId: categoryMap.get("Prototipagem Rápida & Impressão 3D")!,
            budgetResourceId: createdBudgets[1].id,
            description: "Compra de Filamento PAHT-CF15 e Bicos Endurecidos",
            trackingMethod: TrackingMethod.NFE,
            documentRef: "NFe-0004921",
            amountCents: 62000, // R$ 620,00
          },
          {
            date: new Date("2026-06-18T16:00:00Z"),
            referenceMonth: 2,
            type: TransactionType.APPLICATION,
            deliveryGroup: DeliveryGroup.MANUFACTURING_CNC,
            categoryId: categoryMap.get("Blocos Poliuretano")!,
            budgetResourceId: createdBudgets[2].id,
            description: "Aquisição Lote Oficial Blocos Modelagem",
            trackingMethod: TrackingMethod.NFE,
            documentRef: "NFe-0019283",
            amountCents: 120000, // R$ 1.200,00
          },
          {
            date: new Date("2026-07-04T09:00:00Z"),
            referenceMonth: 3,
            type: TransactionType.ORIGIN,
            deliveryGroup: DeliveryGroup.MARKETING_SPONSOR,
            categoryId: categoryMap.get("Permuta / Apoio Técnico")!,
            budgetResourceId: createdBudgets[3].id,
            description: "[PERMUTA - ORIGEM] Parceria Técnica SENAI Usinagem CNC",
            trackingMethod: TrackingMethod.SPONSOR_CONTRACT,
            documentRef: "PARC-SENAI-03",
            amountCents: 150000, // R$ 1.500,00
          },
          {
            date: new Date("2026-07-04T09:05:00Z"),
            referenceMonth: 3,
            type: TransactionType.APPLICATION,
            deliveryGroup: DeliveryGroup.MANUFACTURING_CNC,
            categoryId: categoryMap.get("Usinagem CNC")!,
            budgetResourceId: createdBudgets[3].id,
            description: "[PERMUTA - APLICAÇÃO] Usinagem CNC 4 Eixos de 3 Protótipos",
            trackingMethod: TrackingMethod.SPONSOR_CONTRACT,
            documentRef: "PARC-SENAI-03",
            amountCents: 150000, // R$ 1.500,00
          },
          {
            date: new Date("2026-07-19T15:20:00Z"),
            referenceMonth: 3,
            type: TransactionType.APPLICATION,
            deliveryGroup: DeliveryGroup.MANUFACTURING_CNC,
            categoryId: categoryMap.get("Rolamentos & Componentes Mecânicos")!,
            budgetResourceId: createdBudgets[4].id,
            description: "Compra Rolamentos Cerâmicos de Baixo Atrito",
            trackingMethod: TrackingMethod.NFE,
            documentRef: "NFe-0083412",
            amountCents: 95000, // R$ 950,00 (Levemente acima do previsto para demonstrar variação)
          },
          {
            date: new Date("2026-08-03T10:00:00Z"),
            referenceMonth: 4,
            type: TransactionType.ORIGIN,
            deliveryGroup: DeliveryGroup.MARKETING_SPONSOR,
            categoryId: categoryMap.get("Patrocínio Prata")!,
            description: "Cota Patrocínio Prata - Metalúrgica Vanguarda",
            trackingMethod: TrackingMethod.SPONSOR_CONTRACT,
            documentRef: "CONT-2026-004",
            amountCents: 280000, // R$ 2.800,00
          },
          {
            date: new Date("2026-08-15T17:45:00Z"),
            referenceMonth: 4,
            type: TransactionType.APPLICATION,
            deliveryGroup: DeliveryGroup.PIT_DISPLAY,
            categoryId: categoryMap.get("Estande MDF")!,
            budgetResourceId: createdBudgets[5].id,
            description: "Chapas MDF Naval + Corte CNC + LED Totem Pit Display",
            trackingMethod: TrackingMethod.NFE,
            documentRef: "NFe-0038190",
            amountCents: 210000, // R$ 2.100,00
          },
        ],
      });
      console.log("✅ Lançamentos financeiros de demonstração criados.");
    }
  }
}

main()
  .catch((error) => {
    console.error("❌ Erro no seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
