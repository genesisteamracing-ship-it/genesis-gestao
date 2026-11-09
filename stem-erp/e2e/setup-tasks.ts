import { PrismaClient, DeliveryGroup } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomUUID } from "node:crypto";

export default async function setupTaskFixtures() {
  const database = process.env.TASKS_TEST_DATABASE_URL;
  if (!database) throw new Error("Informe o banco local de testes.");
  const url = new URL(database);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/tasks_test") {
    throw new Error("As fixtures exigem um PostgreSQL local chamado tasks_test.");
  }
  const prisma = new PrismaClient({ datasourceUrl: database });
  const password = randomUUID();
  const passwordHash = await hash(password, 10);
  try {
    for (const project of ["desktop", "mobile"]) {
      const key = randomUUID();
      const team = await prisma.team.create({ data: { name: key, slug: key } });
      const adminTeam = await prisma.team.create({ data: { name: key + "-admin", slug: key + "-admin" } });
      const adminEmail = key + "-admin@test.local";
      await prisma.user.create({ data: {
        teamId: adminTeam.id, email: adminEmail, passwordHash, name: "Superadmin teste", role: "SUPER_ADMIN",
      } });
      const adminPrefix = "TASKS_TEST_" + project.toUpperCase() + "_ADMIN";
      process.env[adminPrefix + "_EMAIL"] = adminEmail;
      process.env[adminPrefix + "_PASSWORD"] = password;
      process.env[adminPrefix + "_TARGET_TEAM"] = team.name;
      for (const role of ["editor", "auditor", "denied"] as const) {
        const email = key + "-" + role + "@test.local";
        await prisma.user.create({ data: {
          teamId: team.id, email, passwordHash, name: role === "editor" ? "Editora teste" : role === "auditor" ? "Auditor teste" : "Executora teste",
          role: role === "auditor" ? "AUDITOR" : "TEAM_LEAD", canAccessTasks: role !== "denied",
          canAccessFinance: role === "denied", canAccessCommunication: false, canAccessRoi: false, canAccessDocuments: false,
        } });
        const prefix = "TASKS_TEST_" + project.toUpperCase() + "_" + role.toUpperCase();
        process.env[prefix + "_EMAIL"] = email;
        process.env[prefix + "_PASSWORD"] = password;
      }
      const editor = await prisma.user.findUniqueOrThrow({ where: { email: key + "-editor@test.local" } });
      const fields = { teamId: team.id, creatorKey: editor.id, creatorName: editor.name, creatorUserId: editor.id };
      const a = await prisma.task.create({ data: { ...fields, title: "Protótipo inicial", deliveryGroup: "ENGINEERING_CAD", startDate: new Date("2026-11-10"), endDate: new Date("2026-11-10") } });
      const b = await prisma.task.create({ data: { ...fields, title: "Usinagem de teste", deliveryGroup: "MANUFACTURING_CNC", startDate: new Date("2026-11-11"), endDate: new Date("2026-11-12") } });
      const c = await prisma.task.create({ data: { ...fields, title: "Validação de pista", deliveryGroup: "PROJECT_MANAGEMENT", startDate: new Date("2026-11-13"), endDate: new Date("2026-11-14") } });
      await prisma.taskDependency.createMany({ data: [
        { teamId: team.id, predecessorId: a.id, successorId: b.id },
        { teamId: team.id, predecessorId: b.id, successorId: c.id },
      ] });
      await prisma.riskPath.create({ data: {
        teamId: team.id, name: "Risco de atraso", reason: "Prazo do protótipo",
        steps: { create: [a, b, c].map(({ id: taskId }, position) => ({ position, taskId })) },
      } });
      const sectors = Object.values(DeliveryGroup).slice(0, 5);
      await prisma.task.createMany({ data: Array.from({ length: 47 }, (_, index) => ({
        ...fields, title: "Amostra " + (index + 1), deliveryGroup: sectors[index % sectors.length],
        startDate: new Date("2026-11-20"), endDate: new Date("2026-11-21"),
      })) });
    }
  } finally {
    await prisma.$disconnect();
  }
}
