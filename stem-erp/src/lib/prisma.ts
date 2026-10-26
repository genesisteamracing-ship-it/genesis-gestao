import { PrismaClient } from "@prisma/client";
import { parseEnv } from "@neon/env";
import neonConfig from "../../neon";

const { postgres } = parseEnv(neonConfig, ["DATABASE_URL"]);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: postgres.databaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
