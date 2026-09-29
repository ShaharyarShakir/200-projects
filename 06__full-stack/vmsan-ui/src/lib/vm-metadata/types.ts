export interface VMMetadataRecord {
  name: string;
  createdAt: string;
}

export interface VMMetadataStoreSchema {
  version: number;
  vms: Record<string, VMMetadataRecord>;
}

export interface VMMetadata {
  vmsanId: string;
  name: string;
  createdAt: string;
}
