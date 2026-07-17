export type LogicalColumnType =
  | "String"
  | "Integer"
  | "Boolean"
  | "Float"
  | "Decimal"
  | "Date"
  | "Timestamp"
  | "UUID"
  | "JSON";

export interface ColumnModel {
  name: string;
  type: LogicalColumnType;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  defaultValue?: string;
  autoIncrement?: boolean;
  comment?: string;
  fkReference?: {
    table: string;
    column: string;
  } | null;
}

export interface TableModel {
  id: string;
  name: string;
  columns: ColumnModel[];
  comment?: string;
}

export interface RelationshipModel {
  sourceTable: string;
  targetTable: string;
  sourceColumn: string;
  targetColumn: string;
  cardinality: "1:1" | "1:N" | "N:1" | "N:M";
  cascadeRules?: {
    onDelete?: string;
    onUpdate?: string;
  };
}

export interface SchemaAST {
  tables: TableModel[];
  relationships: RelationshipModel[];
}
