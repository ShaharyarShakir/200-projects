import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "drizzle-kit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export default defineConfig({
  dialect: "postgresql",

  schema: "./src/schema/*",

  out: "./drizzle",

  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
