import { SchemaAST } from "../ast/types.js";

export interface DiagnosticError {
  severity: "error" | "warning";
  message: string;
  table?: string;
  column?: string;
}

export function validateSchemaAST(ast: SchemaAST): DiagnosticError[] {
  const diagnostics: DiagnosticError[] = [];
  const tableNames = new Set<string>();

  for (const table of ast.tables) {
    // 1. Duplicate table names
    if (tableNames.has(table.name)) {
      diagnostics.push({
        severity: "error",
        message: `Duplicate table name: "${table.name}"`,
        table: table.name,
      });
    }
    tableNames.add(table.name);

    const colNames = new Set<string>();
    let hasPk = false;

    for (const col of table.columns) {
      // 2. Duplicate column names within a table
      if (colNames.has(col.name)) {
        diagnostics.push({
          severity: "error",
          message: `Duplicate column name: "${col.name}" inside table "${table.name}"`,
          table: table.name,
          column: col.name,
        });
      }
      colNames.add(col.name);

      if (col.primaryKey) {
        hasPk = true;
      }

      // 3. Invalid foreign key targets
      if (col.fkReference) {
        const targetTable = ast.tables.find((t) => t.name === col.fkReference?.table);
        if (!targetTable) {
          diagnostics.push({
            severity: "error",
            message: `Foreign key on column "${col.name}" references non-existent table "${col.fkReference.table}"`,
            table: table.name,
            column: col.name,
          });
        } else {
          const targetCol = targetTable.columns.find((c) => c.name === col.fkReference?.column);
          if (!targetCol) {
            diagnostics.push({
              severity: "error",
              message: `Foreign key on column "${col.name}" references non-existent column "${col.fkReference.column}" inside table "${col.fkReference.table}"`,
              table: table.name,
              column: col.name,
            });
          }
        }
      }
    }

    // 4. Missing primary keys warning
    if (!hasPk) {
      diagnostics.push({
        severity: "warning",
        message: `Table "${table.name}" is missing a Primary Key (PK)`,
        table: table.name,
      });
    }
  }

  return diagnostics;
}
