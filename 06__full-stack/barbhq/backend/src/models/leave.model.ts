import mongoose, { Schema, type Document, Types } from 'mongoose';

export enum LeaveType {
  ANNUAL = 'ANNUAL',
  SICK = 'SICK',
  PERSONAL = 'PERSONAL',
  UNPAID = 'UNPAID',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface ILeaveRequest extends Document {
  shopId: Types.ObjectId;
  employeeId: Types.ObjectId;
  type: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason?: string;
  status: LeaveStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const leaveRequestSchema = new Schema<ILeaveRequest>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(LeaveType),
      required: [true, 'Leave type is required'],
    },
    startDate: {
      type: String,
      required: [true, 'Start date is required (YYYY-MM-DD)'],
      trim: true,
    },
    endDate: {
      type: String,
      required: [true, 'End date is required (YYYY-MM-DD)'],
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(LeaveStatus),
      default: LeaveStatus.PENDING,
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: unknown, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        ret.shopId = ret.shopId ? ret.shopId.toString() : ret.shopId;
        ret.employeeId = ret.employeeId ? ret.employeeId.toString() : ret.employeeId;
        if (ret.reviewedBy) ret.reviewedBy = ret.reviewedBy.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

leaveRequestSchema.index({ shopId: 1, employeeId: 1, startDate: 1 });
leaveRequestSchema.index({ shopId: 1, status: 1 });

export const LeaveRequest = mongoose.model<ILeaveRequest>('LeaveRequest', leaveRequestSchema);
