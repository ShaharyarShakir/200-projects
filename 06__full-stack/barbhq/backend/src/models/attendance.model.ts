import mongoose, { Schema, type Document, Types } from 'mongoose';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY',
  ON_LEAVE = 'ON_LEAVE',
}

export interface IAttendance extends Document {
  shopId: Types.ObjectId;
  employeeId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  scheduledStart?: Date;
  scheduledEnd?: Date;
  clockIn?: Date;
  clockOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  workedMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  overtimeMinutes: number;
  status: AttendanceStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
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
      required: [true, 'Attendance date is required (YYYY-MM-DD)'],
      trim: true,
    },
    scheduledStart: Date,
    scheduledEnd: Date,
    clockIn: Date,
    clockOut: Date,
    breakStart: Date,
    breakEnd: Date,
    workedMinutes: {
      type: Number,
      default: 0,
    },
    lateMinutes: {
      type: Number,
      default: 0,
    },
    earlyLeaveMinutes: {
      type: Number,
      default: 0,
    },
    overtimeMinutes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(AttendanceStatus),
      default: AttendanceStatus.PRESENT,
    },
    notes: {
      type: String,
      default: '',
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

attendanceSchema.index({ shopId: 1, employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ shopId: 1, date: 1 });
attendanceSchema.index({ shopId: 1, employeeId: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
