import { Controller, Post, Body } from "@nestjs/common";
import type { SchemaAST } from "@eraser/schema-engine";
import {
  parseSql,
  parsePrisma,
  parseDrizzle,
  parseTypeorm,
  parseMongoose,
  generateSql,
  generatePrisma,
  generateDrizzle,
  generateTypeorm,
  generateMongoose,
  generateMermaid,
  validateSchemaAST,
} from "@eraser/schema-engine";

@Controller("schema")
export class SchemaController {
  @Post("import")
  importSchema(
    @Body("type") type: "sql" | "prisma" | "drizzle" | "typeorm" | "mongoose",
    @Body("code") code: string
  ) {
    let ast: SchemaAST = { tables: [], relationships: [] };

    try {
      if (type === "sql") {
        ast = parseSql(code);
      } else if (type === "prisma") {
        ast = parsePrisma(code);
      } else if (type === "drizzle") {
        ast = parseDrizzle(code);
      } else if (type === "typeorm") {
        ast = parseTypeorm(code);
      } else if (type === "mongoose") {
        ast = parseMongoose(code);
      }
      return { success: true, ast };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to parse schema" };
    }
  }

  @Post("export")
  exportSchema(
    @Body("ast") ast: any,
    @Body("type") type: "sql" | "prisma" | "drizzle" | "typeorm" | "mongoose" | "mermaid",
    @Body("dialect") dialect?: "postgres" | "mysql" | "sqlite" | "sqlserver"
  ) {
    try {
      let code = "";
      if (type === "sql") {
        code = generateSql(ast, dialect || "postgres");
      } else if (type === "prisma") {
        code = generatePrisma(ast);
      } else if (type === "drizzle") {
        code = generateDrizzle(ast);
      } else if (type === "typeorm") {
        code = generateTypeorm(ast);
      } else if (type === "mongoose") {
        code = generateMongoose(ast);
      } else if (type === "mermaid") {
        code = generateMermaid(ast);
      }
      return { success: true, code };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to generate schema code" };
    }
  }

  @Post("validate")
  validateSchema(@Body("ast") ast: any) {
    try {
      const diagnostics = validateSchemaAST(ast);
      return { success: true, diagnostics };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to validate schema" };
    }
  }
}
