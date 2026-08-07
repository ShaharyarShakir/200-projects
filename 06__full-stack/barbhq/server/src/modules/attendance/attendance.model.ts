import { Schema, model, Document } from 'mongoose';
import type { IAttendance } from './attendance.types';

export interface IAttendanceDocument extends IAttendance, Document {
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendanceDocument>(
  {
    shopId: { type: Schema.Types.ObjectId as any, ref: 'Shop', required: true },
    employeeId: { type: Schema.Types.ObjectId as any, ref: 'Employee', required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    clockIn: { type: Date, required: true },
    clockOut: { type: Date },
    breakStart: { type: Date },
    breakEnd: { type: Date },
    workedMinutes: { type: Number, required: true, default: 0 },
    overtimeMinutes: { type: Number, required: true, default: 0 },
    status: {
      type: String as any,
      required: true,
      enum: ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'],
      default: 'PRESENT',
    },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
);

// Compound index to guarantee only one record per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const AttendanceModel = model<IAttendanceDocument>('Attendance', attendanceSchema);
