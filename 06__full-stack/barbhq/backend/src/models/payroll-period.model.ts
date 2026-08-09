import mongoose, { Schema, type Document, Types } from 'mongoose';

export enum PayrollPeriodStatus {
  OPEN = 'OPEN',
  PROCESSING = 'PROCESSING',
  FINALIZED = 'FINALIZED',
  PAID = 'PAID',
}

export interface IPayrollPeriod extends Document {
  shopId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  payDate?: Date;
  status: PayrollPeriodStatus;
  createdBy: Types.ObjectId;
  finalizedBy?: Types.ObjectId;
  finalizedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const payrollPeriodSchema = new Schema<IPayrollPeriod>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    payDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(PayrollPeriodStatus),
      default: PayrollPeriodStatus.OPEN,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    finalizedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    finalizedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: unknown, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        ret.shopId = ret.shopId ? ret.shopId.toString() : ret.shopId;
        if (ret.createdBy) ret.createdBy = ret.createdBy.toString();
        if (ret.finalizedBy) ret.finalizedBy = ret.finalizedBy.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

payrollPeriodSchema.index({ shopId: 1, startDate: 1, endDate: 1 }, { unique: true });

export const PayrollPeriod = mongoose.model<IPayrollPeriod>('PayrollPeriod', payrollPeriodSchema);
