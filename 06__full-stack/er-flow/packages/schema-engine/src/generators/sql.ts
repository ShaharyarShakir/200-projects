import { SchemaAST, LogicalColumnType } from "../ast/types.js";

type SqlDialect = "postgres" | "mysql" | "sqlite" | "sqlserver";

const DIALECT_MAPPINGS: Record<SqlDialect, Record<LogicalColumnType, string>> = {
  postgres: {
    String: "VARCHAR(255)",
    Integer: "INTEGER",
    Boolean: "BOOLEAN",
    Float: "DOUBLE PRECISION",
    Decimal: "NUMERIC",
    Date: "DATE",
    Timestamp: "TIMESTAMP",
    UUID: "UUID",
    JSON: "JSONB",
  },
  mysql: {
    String: "VARCHAR(255)",
    Integer: "INT",
    Boolean: "TINYINT(1)",
    Float: "DOUBLE",
    Decimal: "DECIMAL(10,2)",
    Date: "DATE",
    Timestamp: "DATETIME",
    UUID: "CHAR(36)",
    JSON: "JSON",
  },
  sqlite: {
    String: "TEXT",
    Integer: "INTEGER",
    Boolean: "INTEGER",
    Float: "REAL",
    Decimal: "NUMERIC",
    Date: "TEXT",
    Timestamp: "TEXT",
    UUID: "TEXT",
    JSON: "TEXT",
  },
  sqlserver: {
    String: "NVARCHAR(255)",
    Integer: "INT",
    Boolean: "BIT",
    Float: "FLOAT",
    Decimal: "DECIMAL(18,2)",
    Date: "DATE",
    Timestamp: "DATETIME2",
    UUID: "UNIQUEIDENTIFIER",
    JSON: "NVARCHAR(MAX)",
  },
};

export function generateSql(ast: SchemaAST, dialect: SqlDialect): string {
  let sql = `-- SQL DDL Generated for ${dialect.toUpperCase()}\n-- Generated at: ${new Date().toISOString()}\n\n`;
  const fkConstraints: string[] = [];

  for (const table of ast.tables) {
    const tableName = table.name.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
    sql += `CREATE TABLE ${tableName} (\n`;

    const lines: string[] = [];
    const pks: string[] = [];

    for (const col of table.columns) {
      const colName = col.name.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
      const mappedType = DIALECT_MAPPINGS[dialect][col.type] || "VARCHAR(255)";

      let line = `  ${colName} ${mappedType}`;

      if (col.primaryKey) {
        pks.push(colName);
      }
      if (!col.nullable) {
        line += " NOT NULL";
      }
      if (col.unique) {
        line += " UNIQUE";
      }
      if (col.autoIncrement && dialect !== "sqlite") {
        line += dialect === "postgres" ? " GENERATED ALWAYS AS IDENTITY" : " AUTO_INCREMENT";
      }

      if (col.defaultValue !== undefined && col.defaultValue.trim() !== "") {
        const val = col.defaultValue.trim();
        const needsQuotes = ["String", "Date", "Timestamp", "UUID"].includes(col.type);
        if (needsQuotes && !val.startsWith("'") && !val.includes("(")) {
          line += ` DEFAULT '${val}'`;
        } else {
          line += ` DEFAULT ${val}`;
        }
      }

      lines.push(line);
    }

    if (pks.length > 0) {
      lines.push(`  PRIMARY KEY (${pks.join(", ")})`);
    }

    sql += lines.join(",\n");
    sql += "\n);\n\n";
  }

  // Generate relationship foreign key statements
  for (const rel of ast.relationships) {
    const srcTable = rel.sourceTable.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
    const targetTable = rel.targetTable.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
    const srcCol = rel.sourceColumn.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
    const targetCol = rel.targetColumn.toLowerCase().replace(/[^a-z0-9_]+/g, "_");

    if (dialect === "sqlite") {
      fkConstraints.push(
        `-- SQLite Inline Reference Note:\n-- FOREIGN KEY (${srcCol}) REFERENCES ${targetTable}(${targetCol})`
      );
    } else {
      const fkName = `fk_${srcTable}_${targetTable}_${srcCol}`;
      fkConstraints.push(
        `ALTER TABLE ${srcTable} ADD CONSTRAINT ${fkName}\n  FOREIGN KEY (${srcCol}) REFERENCES ${targetTable}(${targetCol});`
      );
    }
  }

  if (fkConstraints.length > 0) {
    sql += `-- Foreign Key Constraints\n`;
    sql += fkConstraints.join("\n\n") + "\n";
  }

  return sql;
}
