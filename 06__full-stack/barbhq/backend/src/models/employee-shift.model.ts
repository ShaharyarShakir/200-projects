import mongoose, { Schema, type Document, Types } from 'mongoose';

export interface IEmployeeShift extends Document {
  shopId: Types.ObjectId;
  employeeId: Types.ObjectId;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakDurationMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const employeeShiftSchema = new Schema<IEmployeeShift>(
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
    dayOfWeek: {
      type: Number,
      required: [true, 'Day of week is required (0-6)'],
      min: 0,
      max: 6,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (HH:mm)'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (HH:mm)'],
      trim: true,
    },
    breakDurationMinutes: {
      type: Number,
      default: 60,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: unknown, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        ret.shopId = ret.shopId ? ret.shopId.toString() : ret.shopId;
        ret.employeeId = ret.employeeId ? ret.employeeId.toString() : ret.employeeId;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

employeeShiftSchema.index({ shopId: 1, employeeId: 1, dayOfWeek: 1 }, { unique: true });

export const EmployeeShift = mongoose.model<IEmployeeShift>('EmployeeShift', employeeShiftSchema);
