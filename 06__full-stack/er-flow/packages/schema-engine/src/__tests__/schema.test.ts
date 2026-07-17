import { describe, it, expect } from "vitest";
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
  SchemaAST
} from "../index";

describe("SQL Parser & Generator", () => {
  it("should parse SQL CREATE TABLE statements with primary and foreign keys", () => {
    const sql = `
      CREATE TABLE users (
        id UUID PRIMARY KEY UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL
      );
      CREATE TABLE posts (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(100) NOT NULL,
        author_id UUID REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    const ast = parseSql(sql);
    expect(ast.tables.length).toBe(2);
    expect(ast.tables[0].name).toBe("users");
    expect(ast.tables[0].columns[0].name).toBe("id");
    expect(ast.tables[0].columns[0].type).toBe("UUID");
    expect(ast.tables[0].columns[0].primaryKey).toBe(true);

    expect(ast.relationships.length).toBe(1);
    expect(ast.relationships[0].sourceTable).toBe("posts");
    expect(ast.relationships[0].targetTable).toBe("users");
  });

  it("should generate valid SQL DDL statements for multiple dialects", () => {
    const ast: SchemaAST = {
      tables: [
        {
          id: "users",
          name: "users",
          columns: [
            { name: "id", type: "UUID", nullable: false, primaryKey: true, unique: true },
            { name: "email", type: "String", nullable: false, primaryKey: false, unique: true }
          ]
        }
      ],
      relationships: []
    };

    const pgSql = generateSql(ast, "postgres");
    expect(pgSql).toContain("id UUID NOT NULL UNIQUE");
    expect(pgSql).toContain("PRIMARY KEY (id)");

    const mySql = generateSql(ast, "mysql");
    expect(mySql).toContain("id CHAR(36) NOT NULL UNIQUE");
  });
});

describe("Prisma Parser & Generator", () => {
  it("should parse model definition structure and relations in Prisma schema", () => {
    const prisma = `
      model User {
        id    Int     @id @default(autoincrement())
        email String  @unique
        posts Post[]
      }
      model Post {
        id       Int    @id @default(autoincrement())
        title    String
        authorId Int
        author   User   @relation(fields: [authorId], references: [id])
      }
    `;

    const ast = parsePrisma(prisma);
    expect(ast.tables.length).toBe(2);
    expect(ast.tables[0].name).toBe("User");
    expect(ast.tables[0].columns[0].type).toBe("Integer");
    expect(ast.relationships.length).toBe(1);
  });

  it("should generate valid schema.prisma model file representation", () => {
    const ast: SchemaAST = {
      tables: [
        {
          id: "User",
          name: "User",
          columns: [
            { name: "id", type: "Integer", nullable: false, primaryKey: true, unique: false, autoIncrement: true },
            { name: "email", type: "String", nullable: false, primaryKey: false, unique: true }
          ]
        }
      ],
      relationships: []
    };

    const prismaCode = generatePrisma(ast);
    expect(prismaCode).toContain("model User {");
    expect(prismaCode).toContain("id Int @id @default(autoincrement())");
    expect(prismaCode).toContain("email String @unique");
  });
});

describe("Drizzle Schema", () => {
  it("should parse and generate Drizzle schema code", () => {
    const drizzleInput = `
      export const users = pgTable('users', {
        id: uuid('id').primaryKey().notNull(),
        email: varchar('email', { length: 255 }).unique()
      });
    `;
    const ast = parseDrizzle(drizzleInput);
    expect(ast.tables[0].name).toBe("users");

    const code = generateDrizzle(ast);
    expect(code).toContain("export const users = pgTable(\"users\", {");
  });
});

describe("TypeORM & Mongoose", () => {
  it("should parse and generate TypeORM entities", () => {
    const typeormInput = `
      @Entity('users')
      export class User {
        @PrimaryGeneratedColumn()
        id: number;
      }
    `;
    const ast = parseTypeorm(typeormInput);
    expect(ast.tables[0].name).toBe("users");

    const code = generateTypeorm(ast);
    expect(code).toContain("@Entity(\"users\")");
  });

  it("should parse and generate Mongoose schema declarations", () => {
    const mongooseInput = `
      const UserSchema = new Schema({
        email: { type: String, unique: true }
      });
    `;
    const ast = parseMongoose(mongooseInput);
    expect(ast.tables[0].name).toBe("user");

    const code = generateMongoose(ast);
    expect(code).toContain("const UserSchema = new mongoose.Schema({");
  });
});

describe("Mermaid ER Exporter", () => {
  it("should export schema AST to Mermaid ER format", () => {
    const ast: SchemaAST = {
      tables: [
        {
          id: "users",
          name: "users",
          columns: [
            { name: "id", type: "UUID", nullable: false, primaryKey: true, unique: true }
          ]
        }
      ],
      relationships: []
    };

    const mermaid = generateMermaid(ast);
    expect(mermaid).toContain("erDiagram");
    expect(mermaid).toContain("USERS {");
    expect(mermaid).toContain("uuid id PK");
  });
});

describe("Schema AST Integrity Diagnostics Validator", () => {
  it("should detect missing primary keys and duplicate tables", () => {
    const ast: SchemaAST = {
      tables: [
        {
          id: "users",
          name: "users",
          columns: [
            { name: "id", type: "UUID", nullable: false, primaryKey: false, unique: false }
          ]
        },
        {
          id: "users_dup",
          name: "users",
          columns: [
            { name: "id", type: "UUID", nullable: false, primaryKey: true, unique: false }
          ]
        }
      ],
      relationships: []
    };

    const diagnostics = validateSchemaAST(ast);
    expect(diagnostics.some(d => d.message.includes("missing a Primary Key"))).toBe(true);
    expect(diagnostics.some(d => d.message.includes("Duplicate table name"))).toBe(true);
  });
});
