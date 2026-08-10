import { auditLogRepository, AuditLogRepository } from './audit-log.repository';
import type { CreateAuditLogDto } from './audit-log.types';
import type { IAuditLog } from '../../models/audit-log.model';

export class AuditLogService {
  constructor(private repository: AuditLogRepository = auditLogRepository) {}

  async logAction(dto: CreateAuditLogDto): Promise<IAuditLog> {
    return this.repository.create(dto);
  }

  async getShopAuditLogs(shopId: string, limit?: number): Promise<IAuditLog[]> {
    return this.repository.findByShop(shopId, limit);
  }

  async getEntityAuditLogs(shopId: string, entity: string, entityId: string): Promise<IAuditLog[]> {
    return this.repository.findByEntity(shopId, entity, entityId);
  }
}

export const auditLogService = new AuditLogService();
