import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("DATABASE_URL exists:", !!databaseUrl);
  
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing. Please check your environment variables.");
  }
  
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = createPrismaClient();