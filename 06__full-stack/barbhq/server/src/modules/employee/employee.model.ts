import { Schema, model, Document } from 'mongoose';
import type { IEmployee } from './employee.types';

export interface IEmployeeDocument extends IEmployee, Document {
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployeeDocument>(
  {
    shopId: { type: Schema.Types.ObjectId as any, ref: 'Shop', required: true },
    userId: { type: Schema.Types.ObjectId as any, ref: 'User' },
    employeeCode: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    role: {
      type: String,
      required: true,
      enum: ['OWNER', 'MANAGER', 'RECEPTIONIST', 'BARBER'],
    },
    avatar: { type: String, trim: true },
    employmentType: {
      type: String,
      required: true,
      enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT'],
    },
    hireDate: { type: Date, required: true, default: Date.now },
    salaryType: {
      type: String,
      required: true,
      enum: ['MONTHLY', 'HOURLY', 'COMMISSION_ONLY'],
    },
    salary: { type: Number, required: true, default: 0 },
    commissionEnabled: { type: Boolean, required: true, default: false },
    commissionRate: { type: Number, required: true, default: 0 },
    status: {
      type: String as any,
      required: true,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ON_LEAVE'],
      default: 'ACTIVE',
    },
    isClockedIn: { type: Boolean, required: true, default: false },
    createdBy: { type: Schema.Types.ObjectId as any, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId as any, ref: 'User', required: true },
  },
  {
    timestamps: true,
  },
);

// Enforce unique emails per shop
employeeSchema.index({ shopId: 1, email: 1 }, { unique: true });

export const EmployeeModel = model<IEmployeeDocument>('Employee', employeeSchema);
