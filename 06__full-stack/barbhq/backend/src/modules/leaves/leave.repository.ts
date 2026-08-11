import { LeaveRequest, LeaveStatus, type ILeaveRequest } from '../../models/leave.model';
import type { CreateLeaveRequestDto } from './leave.types';

export class LeaveRepository {
  async create(shopId: string, employeeId: string, data: CreateLeaveRequestDto): Promise<ILeaveRequest> {
    const leave = new LeaveRequest({
      ...data,
      shopId,
      employeeId,
      status: LeaveStatus.PENDING,
    });
    return leave.save();
  }

  async findByShop(shopId: string, status?: LeaveStatus): Promise<ILeaveRequest[]> {
    const query: Record<string, any> = { shopId };
    if (status) query.status = status;
    return LeaveRequest.find(query)
      .populate('employeeId', 'firstName lastName email role')
      .populate('reviewedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
  }

  async findByEmployee(shopId: string, employeeId: string): Promise<ILeaveRequest[]> {
    return LeaveRequest.find({ shopId, employeeId }).sort({ createdAt: -1 });
  }

  async findByIdAndShop(id: string, shopId: string): Promise<ILeaveRequest | null> {
    return LeaveRequest.findOne({ _id: id, shopId })
      .populate('employeeId', 'firstName lastName email role')
      .populate('reviewedBy', 'firstName lastName email');
  }

  async findOverlappingLeaves(shopId: string, employeeId: string, startDate: string, endDate: string): Promise<ILeaveRequest[]> {
    return LeaveRequest.find({
      shopId,
      employeeId,
      status: { $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });
  }

  async deletePending(id: string, shopId: string, employeeId: string): Promise<ILeaveRequest | null> {
    return LeaveRequest.findOneAndDelete({ _id: id, shopId, employeeId, status: LeaveStatus.PENDING });
  }
}

export const leaveRepository = new LeaveRepository();
