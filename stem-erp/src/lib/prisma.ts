import { PrismaClient } from "@prisma/client";
import { parseEnv } from "@neon/env";
import neonConfig from "../../neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let productionPrismaClient: PrismaClient | undefined;

function getPrismaClient(): PrismaClient {
  const existing = globalForPrisma.prisma ?? productionPrismaClient;
  if (existing) {
    return existing;
  }

  const { postgres } = parseEnv(neonConfig, ["DATABASE_URL"]);

  const client = new PrismaClient({
    datasources: {
      db: {
        url: postgres.databaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  } else {
    productionPrismaClient = client;
  }

  return client;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
