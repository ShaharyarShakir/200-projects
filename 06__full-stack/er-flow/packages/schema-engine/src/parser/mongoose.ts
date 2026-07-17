import { SchemaAST, TableModel, ColumnModel, RelationshipModel, LogicalColumnType } from "../ast/types.js";

function inferMongooseType(jsType: string): LogicalColumnType {
  const j = jsType.trim();
  if (j === "Number") return "Integer";
  if (j === "String") return "String";
  if (j === "Boolean") return "Boolean";
  if (j === "Date") return "Timestamp";
  if (j === "Buffer") return "JSON";
  if (j.includes("ObjectId")) return "UUID";
  return "String";
}

export function parseMongoose(mongooseText: string): SchemaAST {
  const tables: TableModel[] = [];
  const relationships: RelationshipModel[] = [];

  const cleanText = mongooseText.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

  // Match: const UserSchema = new Schema({ ... })
  const schemaRegex = /(?:const|let|var)\s+(\w+Schema)\s*=\s*new\s+(?:mongoose\.)?Schema\s*\(\s*{([\s\S]*?)}\s*\)/gi;
  let match;
  while ((match = schemaRegex.exec(cleanText)) !== null) {
    const schemaName = match[1].trim();
    const tableName = schemaName.replace("Schema", "").toLowerCase();
    const schemaBody = match[2];
    const columns: ColumnModel[] = [];

    // Match field definition patterns: email: { type: String, unique: true } or email: String
    const fieldRegex = /(\w+)\s*:\s*(?:{([\s\S]*?)}|(\w+))/gi;
    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(schemaBody)) !== null) {
      const colName = fieldMatch[1].trim();
      const colOptions = fieldMatch[2];
      const directType = fieldMatch[3];

      let colType: LogicalColumnType = "String";
      let primaryKey = colName === "_id" || colName === "id";
      let unique = false;
      let nullable = true;
      let defaultValue: string | undefined;

      if (directType) {
        colType = inferMongooseType(directType);
      } else if (colOptions) {
        const typeMatch = colOptions.match(/type\s*:\s*(\w+(?:\.\w+)*)/i);
        if (typeMatch) {
          const typeStr = typeMatch[1];
          colType = inferMongooseType(typeStr.includes(".") ? typeStr.split(".").pop()! : typeStr);
        }

        unique = colOptions.includes("unique: true");
        nullable = !colOptions.includes("required: true");
        
        const defaultMatch = colOptions.match(/default\s*:\s*(['"][^'"]*['"]|\S+)/i);
        if (defaultMatch) {
          defaultValue = defaultMatch[1].trim().replace(/^'|'$/g, "").replace(/^"|"$/g, "");
        }

        // References target (e.g. ref: 'User')
        const refMatch = colOptions.match(/ref\s*:\s*['"](\w+)['"]/i);
        if (refMatch) {
          const targetTable = refMatch[1].toLowerCase();
          relationships.push({
            sourceTable: tableName,
            targetTable,
            sourceColumn: colName,
            targetColumn: "_id",
            cardinality: "1:N",
          });
        }
      }

      columns.push({
        name: colName,
        type: colType,
        nullable,
        primaryKey,
        unique,
        defaultValue,
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
