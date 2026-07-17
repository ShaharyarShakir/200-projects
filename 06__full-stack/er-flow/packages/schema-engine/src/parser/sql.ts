import { SchemaAST, TableModel, ColumnModel, RelationshipModel, LogicalColumnType } from "../ast/types.js";

function mapSqlType(typeStr: string): LogicalColumnType {
  const t = typeStr.toUpperCase().trim();
  if (t.includes("INT") || t === "INTEGER" || t === "SERIAL") return "Integer";
  if (t.includes("CHAR") || t.includes("TEXT") || t.includes("STRING")) return "String";
  if (t === "BOOLEAN" || t === "BOOL" || t === "TINYINT(1)") return "Boolean";
  if (t === "FLOAT" || t === "REAL") return "Float";
  if (t === "DECIMAL" || t.includes("NUMERIC")) return "Decimal";
  if (t === "DATE") return "Date";
  if (t.includes("TIME") || t.includes("DATE")) return "Timestamp";
  if (t.includes("UUID") || t === "UNIQUEIDENTIFIER") return "UUID";
  if (t.includes("JSON")) return "JSON";
  return "String";
}

export function parseSql(sqlText: string): SchemaAST {
  const tables: TableModel[] = [];
  const relationships: RelationshipModel[] = [];

  // Cleanup comments and newlines
  const cleanSql = sqlText
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ");

  // Find CREATE TABLE statements using a bracket counter scanner
  let pos = 0;
  while (true) {
    const startIdx = cleanSql.toUpperCase().indexOf("CREATE TABLE", pos);
    if (startIdx === -1) break;

    // Find opening parenthesis
    const openParenIdx = cleanSql.indexOf("(", startIdx);
    if (openParenIdx === -1) {
      pos = startIdx + 12;
      continue;
    }

    const tableName = cleanSql.slice(startIdx + 12, openParenIdx).trim().toLowerCase();

    // Match closing parenthesis
    let braceDepth = 1;
    let closeParenIdx = -1;
    for (let i = openParenIdx + 1; i < cleanSql.length; i++) {
      if (cleanSql[i] === "(") braceDepth++;
      else if (cleanSql[i] === ")") braceDepth--;

      if (braceDepth === 0) {
        closeParenIdx = i;
        break;
      }
    }

    if (closeParenIdx === -1) {
      pos = openParenIdx + 1;
      continue;
    }

    const tableBody = cleanSql.slice(openParenIdx + 1, closeParenIdx);
    pos = closeParenIdx + 1;

    const columns: ColumnModel[] = [];
    
    // Split by commas, taking care of brackets e.g. DECIMAL(10,2) or REFERENCES
    const lines: string[] = [];
    let currentLine = "";
    let parenDepth = 0;
    for (let i = 0; i < tableBody.length; i++) {
      const char = tableBody[i];
      if (char === "(") parenDepth++;
      else if (char === ")") parenDepth--;

      if (char === "," && parenDepth === 0) {
        lines.push(currentLine.trim());
        currentLine = "";
      } else {
        currentLine += char;
      }
    }
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Handle table constraints e.g. CONSTRAINT fk_author FOREIGN KEY (author_id) REFERENCES users(id)
      if (line.toUpperCase().startsWith("CONSTRAINT") || line.toUpperCase().startsWith("FOREIGN KEY") || line.toUpperCase().startsWith("PRIMARY KEY")) {
        const fkMatch = line.match(/FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s*(\w+)\s*\(([^)]+)\)/i);
        if (fkMatch) {
          const colName = fkMatch[1].trim().toLowerCase();
          const targetTable = fkMatch[2].trim().toLowerCase();
          const targetCol = fkMatch[3].trim().toLowerCase();
          relationships.push({
            sourceTable: tableName,
            targetTable,
            sourceColumn: colName,
            targetColumn: targetCol,
            cardinality: "1:N",
          });
        }
        continue;
      }

      // Columns declarations: name type options...
      const parts = line.split(/\s+/);
      if (parts.length < 2) continue;

      const colName = parts[0].trim().toLowerCase();
      const colTypeStr = parts[1].trim();
      const colType = mapSqlType(colTypeStr);

      const rest = parts.slice(2).join(" ").toUpperCase();
      const primaryKey = rest.includes("PRIMARY KEY");
      const unique = rest.includes("UNIQUE");
      const nullable = !rest.includes("NOT NULL");
      const autoIncrement = rest.includes("AUTOINCREMENT") || rest.includes("AUTO_INCREMENT") || rest.includes("SERIAL");

      let defaultValue: string | undefined;
      const defaultMatch = rest.match(/DEFAULT\s+('([^']*)'|(\S+))/i);
      if (defaultMatch) {
        defaultValue = defaultMatch[2] !== undefined ? defaultMatch[2] : defaultMatch[3];
      }

      // Check for inline references
      let fkReference: ColumnModel["fkReference"] = null;
      const refMatch = line.match(/REFERENCES\s+(\w+)\s*\((\w+)\)/i);
      if (refMatch) {
        const targetTable = refMatch[1].toLowerCase();
        const targetColumn = refMatch[2].toLowerCase();
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

  // Handle out-of-table ALTER TABLE constraints
  const alterTableRegex = /ALTER\s+TABLE\s+(\w+)\s+ADD\s+(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s*(\w+)\s*\(([^)]+)\)/gi;
  let alterMatch;
  while ((alterMatch = alterTableRegex.exec(cleanSql)) !== null) {
    const sourceTable = alterMatch[1].trim();
    const sourceColumn = alterMatch[2].trim();
    const targetTable = alterMatch[3].trim();
    const targetColumn = alterMatch[4].trim();

    relationships.push({
      sourceTable,
      targetTable,
      sourceColumn,
      targetColumn,
      cardinality: "1:N",
    });

    // Update column fkReference in source table if exists
    const srcTable = tables.find((t) => t.name === sourceTable);
    if (srcTable) {
      const srcCol = srcTable.columns.find((c) => c.name === sourceColumn);
      if (srcCol) {
        srcCol.fkReference = { table: targetTable, column: targetColumn };
      }
    }
  }

  return { tables, relationships };
}
