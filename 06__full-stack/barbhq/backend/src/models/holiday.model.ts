import mongoose, { Schema, type Document, Types } from 'mongoose';

export interface IShopHoliday extends Document {
  shopId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const shopHolidaySchema = new Schema<IShopHoliday>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    date: {
      type: String,
      required: [true, 'Holiday date is required (YYYY-MM-DD)'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Holiday name is required'],
      trim: true,
    },
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

shopHolidaySchema.index({ shopId: 1, date: 1 }, { unique: true });

export const ShopHoliday = mongoose.model<IShopHoliday>('ShopHoliday', shopHolidaySchema);
