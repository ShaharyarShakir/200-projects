export interface CreateAuditLogDto {
  shopId: string;
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
}
