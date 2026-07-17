import { SchemaAST, TableModel, ColumnModel, RelationshipModel, LogicalColumnType } from "../ast/types.js";

function inferTypeormType(decorator: string): LogicalColumnType {
  const d = decorator.toLowerCase();
  if (d.includes("primarygeneratedcolumn") || d.includes("int")) return "Integer";
  if (d.includes("uuid")) return "UUID";
  if (d.includes("boolean") || d.includes("bool")) return "Boolean";
  if (d.includes("float")) return "Float";
  if (d.includes("decimal") || d.includes("numeric")) return "Decimal";
  if (d.includes("date") || d.includes("timestamp")) return "Timestamp";
  if (d.includes("json")) return "JSON";
  return "String";
}

export function parseTypeorm(typeormText: string): SchemaAST {
  const tables: TableModel[] = [];
  const relationships: RelationshipModel[] = [];

  const cleanText = typeormText.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

  // Match class EntityName
  const entityRegex = /@Entity\s*\(\s*(?:['"](\w+)['"])?\s*\)\s*export\s+class\s+(\w+)/gi;
  let match;
  while ((match = entityRegex.exec(cleanText)) !== null) {
    const tableName = match[1] || match[2];
    const className = match[2];
    const columns: ColumnModel[] = [];

    // Find class content block
    const classIdx = cleanText.indexOf(className);
    const bodyStart = cleanText.indexOf("{", classIdx);
    if (bodyStart === -1) continue;

    // Find closing brace of class
    let braceDepth = 1;
    let bodyEnd = -1;
    for (let i = bodyStart + 1; i < cleanText.length; i++) {
      if (cleanText[i] === "{") braceDepth++;
      else if (cleanText[i] === "}") braceDepth--;
      if (braceDepth === 0) {
        bodyEnd = i;
        break;
      }
    }
    if (bodyEnd === -1) continue;

    const classBody = cleanText.slice(bodyStart + 1, bodyEnd);

    // Scan columns inside the class body
    const colRegex = /@(Column|PrimaryColumn|PrimaryGeneratedColumn|CreateDateColumn|UpdateDateColumn)\s*\(([^)]*)\)\s*(\w+)\s*:\s*(\w+)/gi;
    let colMatch;
    while ((colMatch = colRegex.exec(classBody)) !== null) {
      const decorator = colMatch[1];
      const decoratorArgs = colMatch[2];
      const colName = colMatch[3];
      const tsType = colMatch[4];

      const colType = inferTypeormType(decorator);
      const primaryKey = decorator.startsWith("Primary");
      const unique = decoratorArgs.includes("unique: true");
      const nullable = decoratorArgs.includes("nullable: true");
      const autoIncrement = decorator === "PrimaryGeneratedColumn";

      columns.push({
        name: colName,
        type: colType,
        nullable,
        primaryKey,
        unique,
        autoIncrement,
      });
    }

    // Scan relationship decorators (e.g. ManyToOne, OneToMany)
    const relRegex = /@(ManyToOne|OneToOne|OneToMany|ManyToMany)\s*\(\s*\(\s*\)\s*=>\s*(\w+)([^)]*)\)\s*(\w+)/gi;
    let relMatch;
    while ((relMatch = relRegex.exec(classBody)) !== null) {
      const relType = relMatch[1];
      const targetEntity = relMatch[2];
      const colName = relMatch[4];

      relationships.push({
        sourceTable: tableName,
        targetTable: targetEntity,
        sourceColumn: colName + "_id",
        targetColumn: "id",
        cardinality: relType === "ManyToOne" ? "1:N" : "1:1",
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
