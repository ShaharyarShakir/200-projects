import { SchemaAST, TableModel, ColumnModel, RelationshipModel, LogicalColumnType } from "../ast/types.js";

function mapPrismaType(typeStr: string): LogicalColumnType {
  const t = typeStr.toLowerCase().trim();
  if (t === "int" || t === "bigint") return "Integer";
  if (t === "string") return "String";
  if (t === "boolean") return "Boolean";
  if (t === "float") return "Float";
  if (t === "decimal") return "Decimal";
  if (t === "datetime") return "Timestamp";
  if (t === "uuid") return "UUID";
  if (t === "json") return "JSON";
  return "String";
}

export function parsePrisma(prismaText: string): SchemaAST {
  const tables: TableModel[] = [];
  const relationships: RelationshipModel[] = [];

  const cleanPrisma = prismaText.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

  // Match model User { ... } blocks
  const modelRegex = /model\s+(\w+)\s*{([^}]*)}/gi;
  let match;
  while ((match = modelRegex.exec(cleanPrisma)) !== null) {
    const modelName = match[1].trim();
    const modelBody = match[2];
    const columns: ColumnModel[] = [];

    const lines = modelBody.split("\n");
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith("@@")) continue; // Skip model-level options

      const parts = line.split(/\s+/);
      if (parts.length < 2) continue;

      const colName = parts[0].trim();
      const colTypeRaw = parts[1].trim();
      const isNullable = colTypeRaw.endsWith("?");
      const colTypeStr = isNullable ? colTypeRaw.slice(0, -1) : colTypeRaw;

      // Skip relational array/model mapping fields (e.g. posts Post[])
      const isRelationField = !["Int", "BigInt", "String", "Boolean", "Float", "Decimal", "DateTime", "Json", "Bytes", "Unsupported"].includes(colTypeStr);
      if (isRelationField) {
        // We will infer relations from the @relation attributes later
        continue;
      }

      const colType = mapPrismaType(colTypeStr);
      const rest = parts.slice(2).join(" ");

      const primaryKey = rest.includes("@id");
      const unique = rest.includes("@unique");
      const autoIncrement = rest.includes("autoincrement()");

      let defaultValue: string | undefined;
      const defaultMatch = rest.match(/@default\(([^)]*)\)/i);
      if (defaultMatch) {
        defaultValue = defaultMatch[1].trim().replace(/^'|'$/g, "").replace(/^"|"$/g, "");
      }

      // Read inline relations references
      let fkReference: ColumnModel["fkReference"] = null;
      const relationMatch = rest.match(/@relation\(([^)]+)\)/i);
      if (relationMatch) {
        // Relational annotations
      }

      columns.push({
        name: colName,
        type: colType,
        nullable: isNullable,
        primaryKey,
        unique,
        defaultValue,
        autoIncrement,
        fkReference,
      });
    }

    tables.push({
      id: modelName,
      name: modelName,
      columns,
    });
  }

  // Parse relations from prisma schema
  const relRegex = /(\w+)\s+(\w+)\??\s+@relation\((?:fields:\s*\[([^\]]+)\],\s*references:\s*\[([^\]]+)\][^)]*)\)/gi;
  let relMatch;
  while ((relMatch = relRegex.exec(cleanPrisma)) !== null) {
    const fieldName = relMatch[1].trim();
    const targetModel = relMatch[2].trim();
    const fieldsList = relMatch[3].split(",").map((s) => s.trim());
    const refsList = relMatch[4].split(",").map((s) => s.trim());

    // Prisma relationships usually live inside a model block. Let's find which model this matches.
    // To do this, we scan which model matches index position of the regex match in prisma text
    const index = relMatch.index;
    const prefix = cleanPrisma.slice(0, index);
    const modelMatches = Array.from(prefix.matchAll(/model\s+(\w+)\s*{/gi));
    if (modelMatches.length > 0) {
      const sourceModel = modelMatches[modelMatches.length - 1][1];
      for (let i = 0; i < fieldsList.length; i++) {
        const sourceCol = fieldsList[i];
        const targetCol = refsList[i] || "id";

        relationships.push({
          sourceTable: sourceModel,
          targetTable: targetModel,
          sourceColumn: sourceCol,
          targetColumn: targetCol,
          cardinality: "1:N",
        });

        // Set the foreign key target
        const srcTable = tables.find((t) => t.name === sourceModel);
        if (srcTable) {
          const srcCol = srcTable.columns.find((c) => c.name === sourceCol);
          if (srcCol) {
            srcCol.fkReference = { table: targetModel, column: targetCol };
          }
        }
      }
    }
  }

  return { tables, relationships };
}
