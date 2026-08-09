import mongoose, { Schema, type Document, Types } from 'mongoose';

export enum AdjustmentType {
  BONUS = 'BONUS',
  DEDUCTION = 'DEDUCTION',
  OVERTIME = 'OVERTIME',
  OTHER = 'OTHER',
}

export interface IPayrollAdjustment extends Document {
  shopId: Types.ObjectId;
  payrollRecordId: Types.ObjectId;
  type: AdjustmentType;
  amount: number;
  reason: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const payrollAdjustmentSchema = new Schema<IPayrollAdjustment>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    payrollRecordId: {
      type: Schema.Types.ObjectId,
      ref: 'PayrollRecord',
      required: [true, 'Payroll Record ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(AdjustmentType),
      required: [true, 'Adjustment type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc: unknown, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        ret.shopId = ret.shopId ? ret.shopId.toString() : ret.shopId;
        ret.payrollRecordId = ret.payrollRecordId ? ret.payrollRecordId.toString() : ret.payrollRecordId;
        if (ret.createdBy) ret.createdBy = ret.createdBy.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

payrollAdjustmentSchema.index({ shopId: 1, payrollRecordId: 1 });

export const PayrollAdjustment = mongoose.model<IPayrollAdjustment>(
  'PayrollAdjustment',
  payrollAdjustmentSchema,
);
