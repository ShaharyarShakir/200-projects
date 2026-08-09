import mongoose, { Schema, type Document, Types } from 'mongoose';

export enum InventoryUnit {
  PIECE = 'PIECE',
  BOX = 'BOX',
  BOTTLE = 'BOTTLE',
  PACK = 'PACK',
  LITER = 'LITER',
  MILLILITER = 'MILLILITER',
  KILOGRAM = 'KILOGRAM',
  GRAM = 'GRAM',
}

export interface IInventoryItem extends Document {
  shopId: Types.ObjectId;
  sku: string;
  name: string;
  description?: string;
  categoryId: Types.ObjectId;
  unit: InventoryUnit;
  currentQuantity: number;
  minimumQuantity: number;
  reorderQuantity: number;
  averageCost: number;
  sellingPrice?: number;
  supplierId?: Types.ObjectId;
  trackStock: boolean;
  isSellable: boolean;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryCategory',
      required: [true, 'Category ID is required'],
      index: true,
    },
    unit: {
      type: String,
      enum: Object.values(InventoryUnit),
      default: InventoryUnit.PIECE,
      required: true,
    },
    currentQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Quantity cannot be negative'],
    },
    minimumQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Minimum quantity cannot be negative'],
    },
    reorderQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Reorder quantity cannot be negative'],
    },
    averageCost: {
      type: Number,
      default: 0,
      min: [0, 'Average cost cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      min: [0, 'Selling price cannot be negative'],
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      index: true,
    },
    trackStock: {
      type: Boolean,
      default: true,
    },
    isSellable: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
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

        if (ret.categoryId) {
          if (typeof ret.categoryId === 'object' && 'toHexString' in ret.categoryId) {
            ret.categoryId = ret.categoryId.toString();
          } else if (typeof ret.categoryId === 'object' && typeof ret.categoryId.toJSON === 'function') {
            ret.categoryId = ret.categoryId.toJSON();
          }
        }

        if (ret.supplierId) {
          if (typeof ret.supplierId === 'object' && 'toHexString' in ret.supplierId) {
            ret.supplierId = ret.supplierId.toString();
          } else if (typeof ret.supplierId === 'object' && typeof ret.supplierId.toJSON === 'function') {
            ret.supplierId = ret.supplierId.toJSON();
          }
        }

        if (ret.createdBy) {
          if (typeof ret.createdBy === 'object' && 'toHexString' in ret.createdBy) {
            ret.createdBy = ret.createdBy.toString();
          } else if (typeof ret.createdBy === 'object' && typeof ret.createdBy.toJSON === 'function') {
            ret.createdBy = ret.createdBy.toJSON();
          }
        }

        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

inventoryItemSchema.index({ shopId: 1, sku: 1 }, { unique: true });

export const InventoryItem = mongoose.model<IInventoryItem>('InventoryItem', inventoryItemSchema);
