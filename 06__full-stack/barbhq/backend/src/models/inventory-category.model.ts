import mongoose, { Schema, type Document, Types } from 'mongoose';

export interface IInventoryCategory extends Document {
  shopId: Types.ObjectId;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryCategorySchema = new Schema<IInventoryCategory>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
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
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

inventoryCategorySchema.index({ shopId: 1, name: 1 }, { unique: true });

export const InventoryCategory = mongoose.model<IInventoryCategory>(
  'InventoryCategory',
  inventoryCategorySchema,
);
