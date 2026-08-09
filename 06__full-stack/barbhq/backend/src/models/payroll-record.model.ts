import mongoose, { Schema, type Document, Types } from 'mongoose';
import { SalaryType } from './employee-compensation.model';

export enum PayrollRecordStatus {
  DRAFT = 'DRAFT',
  FINALIZED = 'FINALIZED',
  PAID = 'PAID',
}

export interface IPayrollRecord extends Document {
  shopId: Types.ObjectId;
  payrollPeriodId: Types.ObjectId;
  employeeId: Types.ObjectId;
  salaryType: SalaryType;
  baseSalary: number;
  regularHours: number;
  overtimeHours: number;
  hourlyRate?: number;
  overtimeRate?: number;
  commissionAmount: number;
  bonusAmount: number;
  deductionAmount: number;
  grossPay: number;
  netPay: number;
  status: PayrollRecordStatus;
  calculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const payrollRecordSchema = new Schema<IPayrollRecord>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    payrollPeriodId: {
      type: Schema.Types.ObjectId,
      ref: 'PayrollPeriod',
      required: [true, 'Payroll Period ID is required'],
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee ID is required'],
      index: true,
    },
    salaryType: {
      type: String,
      enum: Object.values(SalaryType),
      required: true,
    },
    baseSalary: {
      type: Number,
      default: 0,
    },
    regularHours: {
      type: Number,
      default: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    hourlyRate: {
      type: Number,
    },
    overtimeRate: {
      type: Number,
    },
    commissionAmount: {
      type: Number,
      default: 0,
    },
    bonusAmount: {
      type: Number,
      default: 0,
    },
    deductionAmount: {
      type: Number,
      default: 0,
    },
    grossPay: {
      type: Number,
      required: true,
    },
    netPay: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PayrollRecordStatus),
      default: PayrollRecordStatus.DRAFT,
      index: true,
    },
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: unknown, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        ret.shopId = ret.shopId ? ret.shopId.toString() : ret.shopId;

        if (ret.payrollPeriodId) {
          if (typeof ret.payrollPeriodId === 'object' && 'toHexString' in ret.payrollPeriodId) {
            ret.payrollPeriodId = ret.payrollPeriodId.toString();
          } else if (typeof ret.payrollPeriodId === 'object' && typeof ret.payrollPeriodId.toJSON === 'function') {
            ret.payrollPeriodId = ret.payrollPeriodId.toJSON();
          }
        }

        if (ret.employeeId) {
          if (typeof ret.employeeId === 'object' && 'toHexString' in ret.employeeId) {
            ret.employeeId = ret.employeeId.toString();
          } else if (typeof ret.employeeId === 'object' && typeof ret.employeeId.toJSON === 'function') {
            ret.employeeId = ret.employeeId.toJSON();
          }
        }

        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

payrollRecordSchema.index({ shopId: 1, payrollPeriodId: 1, employeeId: 1 }, { unique: true });

export const PayrollRecord = mongoose.model<IPayrollRecord>('PayrollRecord', payrollRecordSchema);
