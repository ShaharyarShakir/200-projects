// Database Connectors Layer Adapter Specifications
// This defines interface contracts for introspecting schemas from live databases

export interface DbIntrospectionOptions {
  connectionString: string;
  schema?: string;
}

export interface IntrospectedSchema {
  tables: Array<{
    name: string;
    columns: Array<{
      name: string;
      type: string;
      nullable: boolean;
      primaryKey: boolean;
      unique: boolean;
      defaultValue?: string;
    }>;
  }>;
  foreignKeys: Array<{
    constraintName: string;
    sourceTable: string;
    sourceColumn: string;
    targetTable: string;
    targetColumn: string;
  }>;
}

export interface DbConnectorAdapter {
  dialect: "postgresql" | "mysql" | "sqlite" | "sqlserver" | "mongodb";
  introspect(options: DbIntrospectionOptions): Promise<IntrospectedSchema>;
  testConnection(connectionString: string): Promise<boolean>;
}

export class ConnectorRegistry {
  private static adapters = new Map<string, DbConnectorAdapter>();

  public static register(adapter: DbConnectorAdapter): void {
    this.adapters.set(adapter.dialect, adapter);
  }

  public static get(dialect: string): DbConnectorAdapter | undefined {
    return this.adapters.get(dialect);
  }
}
