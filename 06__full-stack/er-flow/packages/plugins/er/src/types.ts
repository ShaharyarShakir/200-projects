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

export interface ErAttribute {
  id: string;
  name: string;
  type: LogicalColumnType;
  isPk: boolean;
  isFk: boolean;
  isNullable: boolean;
  isUnique: boolean;
  defaultValue?: string;
  fkReference?: {
    entityId: string;
    attributeId: string;
  } | null;
}

export interface ErEntity {
  id: string;
  name: string;
  attributes: ErAttribute[];
}

export type CardinalityType = "1" | "0..1" | "*" | "1..*" | "0..*";

export interface ErRelationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  sourceCardinality: CardinalityType;
  targetCardinality: CardinalityType;
  identifying: boolean;
  label?: string;
}

export type SqlDialect = "postgres" | "mysql" | "sqlite" | "sqlserver";
