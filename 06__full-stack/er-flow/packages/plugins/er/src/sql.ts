import { ErEntity, ErRelationship, SqlDialect, LogicalColumnType } from "./types";

const DIALECT_TYPES: Record<SqlDialect, Record<LogicalColumnType, string>> = {
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
    UUID: "VARCHAR(36)",
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

export function generateSql(
  entities: ErEntity[],
  relationships: ErRelationship[],
  dialect: SqlDialect
): string {
  let sql = `-- Database Schema Generated for ${dialect.toUpperCase()}\n-- Generated at: ${new Date().toISOString()}\n\n`;

  // Track constraints to output at the bottom or inline
  const fkConstraints: string[] = [];

  // Generate CREATE TABLE for each entity
  for (const entity of entities) {
    const tableName = entity.name.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
    sql += `CREATE TABLE ${tableName} (\n`;

    const lines: string[] = [];
    const pks: string[] = [];

    for (const attr of entity.attributes) {
      const colName = attr.name.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
      const colType = DIALECT_TYPES[dialect][attr.type] || "VARCHAR(255)";
      
      let line = `  ${colName} ${colType}`;

      if (attr.isPk) {
        pks.push(colName);
      }

      if (!attr.isNullable) {
        line += " NOT NULL";
      }

      if (attr.isUnique) {
        line += " UNIQUE";
      }

      if (attr.defaultValue !== undefined && attr.defaultValue.trim() !== "") {
        const val = attr.defaultValue.trim();
        const needsQuotes =
          attr.type === "String" ||
          attr.type === "Date" ||
          attr.type === "Timestamp" ||
          attr.type === "UUID";
        if (needsQuotes && !val.startsWith("'") && !val.includes("(")) {
          line += ` DEFAULT '${val}'`;
        } else {
          line += ` DEFAULT ${val}`;
        }
      }

      lines.push(line);
    }

    // Add Primary Key constraint
    if (pks.length > 0) {
      lines.push(`  PRIMARY KEY (${pks.join(", ")})`);
    }

    sql += lines.join(",\n");
    sql += "\n);\n\n";
  }

  // Generate Foreign Key relationships
  for (const rel of relationships) {
    const source = entities.find((e) => e.id === rel.sourceEntityId);
    const target = entities.find((e) => e.id === rel.targetEntityId);
    if (!source || !target) continue;

    const sourceTable = source.name.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
    const targetTable = target.name.toLowerCase().replace(/[^a-z0-9_]+/g, "_");

    // Look for matching FK attributes inside source referencing target, or target referencing source
    const sourceFkAttrs = source.attributes.filter(
      (a) => a.isFk && a.fkReference && a.fkReference.entityId === target.id
    );
    const targetFkAttrs = target.attributes.filter(
      (a) => a.isFk && a.fkReference && a.fkReference.entityId === source.id
    );

    let processedAny = false;

    if (sourceFkAttrs.length > 0) {
      for (const attr of sourceFkAttrs) {
        const sourceCol = attr.name.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
        const targetAttr = target.attributes.find((a) => a.id === attr.fkReference?.attributeId);
        const targetCol = targetAttr
          ? targetAttr.name.toLowerCase().replace(/[^a-z0-9_]+/g, "_")
          : "id";

        if (dialect === "sqlite") {
          fkConstraints.push(
            `-- Note: SQLite requires foreign keys inline in CREATE TABLE\n-- ALTER TABLE ${sourceTable} ADD FOREIGN KEY (${sourceCol}) REFERENCES ${targetTable}(${targetCol});`
          );
        } else {
          const fkName = `fk_${sourceTable}_${targetTable}_${sourceCol}`;
          fkConstraints.push(
            `ALTER TABLE ${sourceTable} ADD CONSTRAINT ${fkName}\n  FOREIGN KEY (${sourceCol}) REFERENCES ${targetTable}(${targetCol});`
          );
        }
      }
      processedAny = true;
    }

    if (targetFkAttrs.length > 0) {
      for (const attr of targetFkAttrs) {
        const targetCol = attr.name.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
        const sourceAttr = source.attributes.find((a) => a.id === attr.fkReference?.attributeId);
        const sourceCol = sourceAttr
          ? sourceAttr.name.toLowerCase().replace(/[^a-z0-9_]+/g, "_")
          : "id";

        if (dialect === "sqlite") {
          fkConstraints.push(
            `-- Note: SQLite requires foreign keys inline in CREATE TABLE\n-- ALTER TABLE ${targetTable} ADD FOREIGN KEY (${targetCol}) REFERENCES ${sourceTable}(${sourceCol});`
          );
        } else {
          const fkName = `fk_${targetTable}_${sourceTable}_${targetCol}`;
          fkConstraints.push(
            `ALTER TABLE ${targetTable} ADD CONSTRAINT ${fkName}\n  FOREIGN KEY (${targetCol}) REFERENCES ${sourceTable}(${sourceCol});`
          );
        }
      }
      processedAny = true;
    }

    if (!processedAny) {
      // Create a default fallback foreign key if attributes are not mapped yet
      const sourceCol = `${targetTable}_id`;
      if (dialect === "sqlite") {
        fkConstraints.push(
          `-- Mapped Relationship: ${source.name} -> ${target.name}\n-- ALTER TABLE ${sourceTable} ADD FOREIGN KEY (${sourceCol}) REFERENCES ${targetTable}(id);`
        );
      } else {
        const fkName = `fk_${sourceTable}_${targetTable}_auto`;
        fkConstraints.push(
          `-- Mapped Relationship: ${source.name} -> ${target.name}\n-- ALTER TABLE ${sourceTable} ADD CONSTRAINT ${fkName} FOREIGN KEY (${sourceCol}) REFERENCES ${targetTable}(id);`
        );
      }
    }
  }

  if (fkConstraints.length > 0) {
    sql += `-- Foreign Key Constraints\n`;
    sql += fkConstraints.join("\n\n") + "\n";
  }

  return sql;
}
