import mongoose, { Schema, type Document, Types } from 'mongoose';

export enum ShiftExceptionType {
  CUSTOM_SHIFT = 'CUSTOM_SHIFT',
  DAY_OFF = 'DAY_OFF',
  LEAVE = 'LEAVE',
  HOLIDAY = 'HOLIDAY',
}

export interface IShiftException extends Document {
  shopId: Types.ObjectId;
  employeeId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  type: ShiftExceptionType;
  reason?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const shiftExceptionSchema = new Schema<IShiftException>(
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
    date: {
      type: String,
      required: [true, 'Exception date is required (YYYY-MM-DD)'],
      trim: true,
    },
    startTime: {
      type: String,
      trim: true,
    },
    endTime: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(ShiftExceptionType),
      required: [true, 'Shift exception type is required'],
    },
    reason: {
      type: String,
      trim: true,
      default: '',
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
        ret.createdBy = ret.createdBy ? ret.createdBy.toString() : ret.createdBy;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

shiftExceptionSchema.index({ shopId: 1, employeeId: 1, date: 1 }, { unique: true });

export const ShiftException = mongoose.model<IShiftException>('ShiftException', shiftExceptionSchema);
