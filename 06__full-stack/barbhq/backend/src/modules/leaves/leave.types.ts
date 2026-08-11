import { LeaveType, LeaveStatus } from '../../models/leave.model';

export { LeaveType, LeaveStatus };

export interface CreateLeaveRequestDto {
  type: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason?: string;
}

export interface ReviewLeaveRequestDto {
  reason?: string;
}
