import mongoose, { Schema, type Document, Types } from 'mongoose';

export interface IDaySchedule {
  enabled: boolean;
  open?: string;
  close?: string;
}

export interface IBusinessHours extends Document {
  shopId: Types.ObjectId;
  monday: IDaySchedule;
  tuesday: IDaySchedule;
  wednesday: IDaySchedule;
  thursday: IDaySchedule;
  friday: IDaySchedule;
  saturday: IDaySchedule;
  sunday: IDaySchedule;
  createdAt: Date;
  updatedAt: Date;
}

const dayScheduleSchema = new Schema<IDaySchedule>(
  {
    enabled: { type: Boolean, default: true },
    open: { type: String, default: '09:00' },
    close: { type: String, default: '21:00' },
  },
  { _id: false },
);

const businessHoursSchema = new Schema<IBusinessHours>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      unique: true,
      index: true,
    },
    monday: { type: dayScheduleSchema, default: () => ({ enabled: true, open: '09:00', close: '21:00' }) },
    tuesday: { type: dayScheduleSchema, default: () => ({ enabled: true, open: '09:00', close: '21:00' }) },
    wednesday: { type: dayScheduleSchema, default: () => ({ enabled: true, open: '09:00', close: '21:00' }) },
    thursday: { type: dayScheduleSchema, default: () => ({ enabled: true, open: '09:00', close: '21:00' }) },
    friday: { type: dayScheduleSchema, default: () => ({ enabled: true, open: '09:00', close: '21:00' }) },
    saturday: { type: dayScheduleSchema, default: () => ({ enabled: true, open: '09:00', close: '18:00' }) },
    sunday: { type: dayScheduleSchema, default: () => ({ enabled: false, open: '09:00', close: '18:00' }) },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: unknown, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        ret.shopId = ret.shopId ? ret.shopId.toString() : ret.shopId;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const BusinessHours = mongoose.model<IBusinessHours>('BusinessHours', businessHoursSchema);
