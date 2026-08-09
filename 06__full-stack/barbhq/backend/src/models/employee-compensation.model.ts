import mongoose, { Schema, type Document, Types } from 'mongoose';

export enum SalaryType {
  MONTHLY = 'MONTHLY',
  HOURLY = 'HOURLY',
  COMMISSION_ONLY = 'COMMISSION_ONLY',
}

export enum CommissionType {
  SERVICE_REVENUE = 'SERVICE_REVENUE',
  PRODUCT_REVENUE = 'PRODUCT_REVENUE',
  TOTAL_REVENUE = 'TOTAL_REVENUE',
}

export interface IEmployeeCompensation extends Document {
  shopId: Types.ObjectId;
  employeeId: Types.ObjectId;
  salaryType: SalaryType;
  baseSalary?: number;
  hourlyRate?: number;
  commissionEnabled: boolean;
  commissionType?: CommissionType;
  commissionRate?: number;
  overtimeEnabled: boolean;
  overtimeMultiplier: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const employeeCompensationSchema = new Schema<IEmployeeCompensation>(
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
    salaryType: {
      type: String,
      enum: Object.values(SalaryType),
      required: [true, 'Salary type is required'],
    },
    baseSalary: {
      type: Number,
      default: 0,
    },
    hourlyRate: {
      type: Number,
      default: 0,
    },
    commissionEnabled: {
      type: Boolean,
      default: false,
    },
    commissionType: {
      type: String,
      enum: Object.values(CommissionType),
    },
    commissionRate: {
      type: Number,
      default: 0,
    },
    overtimeEnabled: {
      type: Boolean,
      default: true,
    },
    overtimeMultiplier: {
      type: Number,
      default: 1.5,
    },
    effectiveFrom: {
      type: Date,
      required: [true, 'Effective from date is required'],
    },
    effectiveTo: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: unknown, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        ret.shopId = ret.shopId ? ret.shopId.toString() : ret.shopId;
        ret.employeeId = ret.employeeId ? ret.employeeId.toString() : ret.employeeId;
        if (ret.createdBy) ret.createdBy = ret.createdBy.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

employeeCompensationSchema.index({ shopId: 1, employeeId: 1, effectiveFrom: -1 });

export const EmployeeCompensation = mongoose.model<IEmployeeCompensation>(
  'EmployeeCompensation',
  employeeCompensationSchema,
);
