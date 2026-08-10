import { AuditLog, type IAuditLog } from '../../models/audit-log.model';
import type { CreateAuditLogDto } from './audit-log.types';

export class AuditLogRepository {
  async create(data: CreateAuditLogDto): Promise<IAuditLog> {
    const log = new AuditLog(data);
    return log.save();
  }

  async findByShop(shopId: string, limit = 100): Promise<IAuditLog[]> {
    return AuditLog.find({ shopId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('actorId', 'firstName lastName email role');
  }

  async findByEntity(shopId: string, entity: string, entityId: string): Promise<IAuditLog[]> {
    return AuditLog.find({ shopId, entity, entityId })
      .sort({ createdAt: -1 })
      .populate('actorId', 'firstName lastName email role');
  }
}

export const auditLogRepository = new AuditLogRepository();
