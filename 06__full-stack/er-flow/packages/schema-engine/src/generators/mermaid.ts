import { SchemaAST } from "../ast/types.js";

export function generateMermaid(ast: SchemaAST): string {
  let code = "erDiagram\n";

  // Render relationships
  for (const rel of ast.relationships) {
    const src = rel.sourceTable.toUpperCase().replace(/[^A-Z0-9_]+/g, "_");
    const target = rel.targetTable.toUpperCase().replace(/[^A-Z0-9_]+/g, "_");

    // Map source/target cardinality: e.g. "1:N" -> "||--o{"
    let connector = "}o--||"; // default zero-to-many to exactly-one
    if (rel.cardinality === "1:1") {
      connector = "||--||";
    } else if (rel.cardinality === "1:N") {
      connector = "||--o{";
    } else if (rel.cardinality === "N:1") {
      connector = "}o--||";
    } else if (rel.cardinality === "N:M") {
      connector = "}o--o{";
    }

    code += `    ${src} ${connector} ${target} : "references"\n`;
  }

  // Render tables and columns
  for (const table of ast.tables) {
    const tableName = table.name.toUpperCase().replace(/[^A-Z0-9_]+/g, "_");
    code += `    ${tableName} {\n`;

    for (const col of table.columns) {
      const typeStr = col.type.toLowerCase();
      const colName = col.name.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
      
      let keyStr = "";
      if (col.primaryKey) keyStr = "PK";
      else if (col.fkReference) keyStr = "FK";

      code += `        ${typeStr} ${colName} ${keyStr}\n`;
    }

    code += `    }\n\n`;
  }

  return code;
}
