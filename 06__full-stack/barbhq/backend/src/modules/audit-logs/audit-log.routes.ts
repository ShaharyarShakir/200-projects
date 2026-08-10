import { Router } from 'express';
import { auditLogController } from './audit-log.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { UserRole } from '../../models/user.model';

const auditLogRouter = Router();

auditLogRouter.use(authenticate);
auditLogRouter.use(authorize(UserRole.OWNER, UserRole.MANAGER));

auditLogRouter.get('/', auditLogController.getAuditLogs);

export { auditLogRouter };
