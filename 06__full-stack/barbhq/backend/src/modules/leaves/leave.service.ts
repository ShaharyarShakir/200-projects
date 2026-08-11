import { leaveRepository, LeaveRepository } from './leave.repository';
import { auditLogService } from '../audit-logs/audit-log.service';
import { User } from '../../models/user.model';
import { LeaveStatus, type ILeaveRequest } from '../../models/leave.model';
import type { CreateLeaveRequestDto } from './leave.types';
import { ApiError } from '../../utils/ApiError';
import { notificationService } from '../notifications/notification.service';
import { NotificationType } from '../../models/notification.model';

export class LeaveService {
  constructor(private repository: LeaveRepository = leaveRepository) {}

  async createLeaveRequest(shopId: string, employeeId: string, dto: CreateLeaveRequestDto): Promise<ILeaveRequest> {
    const user = await User.findOne({ _id: employeeId, shopId });
    if (!user || !user.isActive) {
      throw new ApiError(403, 'Inactive employee cannot request leave');
    }

    if (dto.startDate > dto.endDate) {
      throw new ApiError(400, 'Start date cannot be after end date');
    }

    const overlapping = await this.repository.findOverlappingLeaves(shopId, employeeId, dto.startDate, dto.endDate);
    if (overlapping.length > 0) {
      throw new ApiError(400, 'You already have an active or pending leave request overlapping with these dates');
    }

    const leave = await this.repository.create(shopId, employeeId, dto);

    // Notify Managers/Owner
    const managers = await User.find({ shopId, role: { $in: ['OWNER', 'MANAGER'] }, isActive: true });
    if (managers.length > 0) {
      notificationService.publish({
        shopId,
        type: NotificationType.LEAVE_REQUESTED,
        recipientIds: managers.map((m) => m._id.toString()),
        data: {
          employeeName: `${user.firstName} ${user.lastName}`,
          leaveType: leave.type,
          startDate: leave.startDate,
          endDate: leave.endDate,
        },
      }).catch((err) => console.error('[Notification Trigger Error]', err));
    }

    return leave;
  }

  async getMyLeaveRequests(shopId: string, employeeId: string): Promise<ILeaveRequest[]> {
    return this.repository.findByEmployee(shopId, employeeId);
  }

  async cancelMyLeaveRequest(id: string, shopId: string, employeeId: string): Promise<void> {
    const deleted = await this.repository.deletePending(id, shopId, employeeId);
    if (!deleted) {
      throw new ApiError(404, 'Pending leave request not found or cannot be cancelled');
    }
  }

  async getShopLeaveRequests(shopId: string, status?: LeaveStatus): Promise<ILeaveRequest[]> {
    return this.repository.findByShop(shopId, status);
  }

  async getLeaveRequestById(id: string, shopId: string): Promise<ILeaveRequest> {
    const leave = await this.repository.findByIdAndShop(id, shopId);
    if (!leave) {
      throw new ApiError(404, 'Leave request not found');
    }
    return leave;
  }

  async approveLeaveRequest(id: string, shopId: string, reviewerId: string): Promise<ILeaveRequest> {
    const leave = await this.repository.findByIdAndShop(id, shopId);
    if (!leave) {
      throw new ApiError(404, 'Leave request not found');
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new ApiError(400, `Cannot approve leave request with status '${leave.status}'`);
    }

    const oldValue = leave.toJSON();
    leave.status = LeaveStatus.APPROVED;
    leave.reviewedBy = reviewerId as any;
    leave.reviewedAt = new Date();
    await leave.save();

    await auditLogService.logAction({
      shopId,
      actorId: reviewerId,
      action: 'LEAVE_APPROVED',
      entity: 'LeaveRequest',
      entityId: id,
      oldValue,
      newValue: leave.toJSON(),
    });

    const recipientId = (leave.employeeId as any)?._id
      ? (leave.employeeId as any)._id.toString()
      : leave.employeeId.toString();

    // Notify Employee
    notificationService.publish({
      shopId,
      type: NotificationType.LEAVE_APPROVED,
      recipientIds: [recipientId],
      data: {
        leaveType: leave.type,
        startDate: leave.startDate,
        endDate: leave.endDate,
      },
    }).catch((err) => console.error('[Notification Trigger Error]', err));

    return leave;
  }

  async rejectLeaveRequest(id: string, shopId: string, reviewerId: string, reason?: string): Promise<ILeaveRequest> {
    const leave = await this.repository.findByIdAndShop(id, shopId);
    if (!leave) {
      throw new ApiError(404, 'Leave request not found');
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new ApiError(400, `Cannot reject leave request with status '${leave.status}'`);
    }

    const oldValue = leave.toJSON();
    leave.status = LeaveStatus.REJECTED;
    leave.reviewedBy = reviewerId as any;
    leave.reviewedAt = new Date();
    if (reason) leave.reason = reason;
    await leave.save();

    await auditLogService.logAction({
      shopId,
      actorId: reviewerId,
      action: 'LEAVE_REJECTED',
      entity: 'LeaveRequest',
      entityId: id,
      oldValue,
      newValue: leave.toJSON(),
    });

    const rejectRecipientId = (leave.employeeId as any)?._id
      ? (leave.employeeId as any)._id.toString()
      : leave.employeeId.toString();

    // Notify Employee
    notificationService.publish({
      shopId,
      type: NotificationType.LEAVE_REJECTED,
      recipientIds: [rejectRecipientId],
      data: {
        leaveType: leave.type,
        startDate: leave.startDate,
        endDate: leave.endDate,
        reason: reason || 'Not specified',
      },
    }).catch((err) => console.error('[Notification Trigger Error]', err));


    return leave;
  }
}

export const leaveService = new LeaveService();

