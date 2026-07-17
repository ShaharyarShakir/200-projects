import { SchemaAST, TableModel, ColumnModel, RelationshipModel, LogicalColumnType } from "../ast/types.js";

function inferDrizzleType(funcName: string): LogicalColumnType {
  const f = funcName.toLowerCase();
  if (f.includes("integer") || f.includes("serial") || f.includes("int")) return "Integer";
  if (f.includes("varchar") || f.includes("text") || f.includes("char")) return "String";
  if (f.includes("boolean")) return "Boolean";
  if (f.includes("double") || f.includes("real") || f.includes("float")) return "Float";
  if (f.includes("decimal") || f.includes("numeric")) return "Decimal";
  if (f.includes("timestamp") || f.includes("date")) return "Timestamp";
  if (f.includes("uuid")) return "UUID";
  if (f.includes("json")) return "JSON";
  return "String";
}

export function parseDrizzle(drizzleText: string): SchemaAST {
  const tables: TableModel[] = [];
  const relationships: RelationshipModel[] = [];

  const cleanText = drizzleText.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

  // Match: const users = pgTable('users', { ... })
  const tableRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:pgTable|mysqlTable|sqliteTable)\s*\(\s*['"]([^'"]+)['"]\s*,\s*{([^}]*(?:{[^}]*}[^}]*)*)}\s*\)/gi;
  let match;
  while ((match = tableRegex.exec(cleanText)) !== null) {
    const tableName = match[2].trim();
    const tableBody = match[3];
    const columns: ColumnModel[] = [];

    // Match column: name: type('db_name').options()
    const colRegex = /(\w+)\s*:\s*(\w+)\s*\([^)]*\)([^,]*)/gi;
    let colMatch;
    while ((colMatch = colRegex.exec(tableBody)) !== null) {
      const colName = colMatch[1].trim();
      const creatorFunc = colMatch[2].trim();
      const chain = colMatch[3].trim().toUpperCase();

      const colType = inferDrizzleType(creatorFunc);
      const primaryKey = chain.includes("PRIMARYKEY");
      const unique = chain.includes("UNIQUE");
      const nullable = !chain.includes("NOTNULL");
      const autoIncrement = chain.includes("AUTOINCREMENT");

      let defaultValue: string | undefined;
      const defaultMatch = chain.match(/DEFAULT\s*\(([^)]*)\)/i);
      if (defaultMatch) {
        defaultValue = defaultMatch[1].trim().replace(/^'|'$/g, "").replace(/^"|"$/g, "");
      }

      let fkReference: ColumnModel["fkReference"] = null;
      const refMatch = chain.match(/REFERENCES\s*\(\s*\(\s*\)\s*=>\s*(\w+)\.(\w+)\s*\)/i) || 
                       chain.match(/\.REFERENCES\s*\(\s*\(\s*\)\s*=>\s*(\w+)\s*,\s*['"]?(\w+)['"]?\s*\)/i);
      if (refMatch) {
        const targetTable = refMatch[1];
        const targetColumn = refMatch[2];
        fkReference = { table: targetTable, column: targetColumn };
        relationships.push({
          sourceTable: tableName,
          targetTable,
          sourceColumn: colName,
          targetColumn,
          cardinality: "1:N",
        });
      }

      columns.push({
        name: colName,
        type: colType,
        nullable,
        primaryKey,
        unique,
        defaultValue,
        autoIncrement,
        fkReference,
      });
    }

    tables.push({
      id: tableName,
      name: tableName,
      columns,
    });
  }

  return { tables, relationships };
}
