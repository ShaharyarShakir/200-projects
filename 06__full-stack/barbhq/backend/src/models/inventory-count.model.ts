import mongoose, { Schema, type Document, Types } from 'mongoose';

export enum InventoryCountStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface IInventoryCountItem {
  _id?: Types.ObjectId;
  inventoryItemId: Types.ObjectId;
  systemQuantity: number;
  countedQuantity: number;
  difference: number;
  reason?: string;
}

export interface IInventoryCount extends Document {
  shopId: Types.ObjectId;
  status: InventoryCountStatus;
  startedAt: Date;
  completedAt?: Date;
  createdBy: Types.ObjectId;
  completedBy?: Types.ObjectId;
  items: IInventoryCountItem[];
  createdAt: Date;
  updatedAt: Date;
}

const inventoryCountItemSchema = new Schema<IInventoryCountItem>(
  {
    inventoryItemId: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: [true, 'Inventory Item ID is required'],
    },
    systemQuantity: {
      type: Number,
      required: true,
      default: 0,
    },
    countedQuantity: {
      type: Number,
      required: true,
      default: 0,
    },
    difference: {
      type: Number,
      required: true,
      default: 0,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    toJSON: {
      transform(_doc: unknown, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        if (ret.inventoryItemId) {
          if (typeof ret.inventoryItemId === 'object' && 'toHexString' in ret.inventoryItemId) {
            ret.inventoryItemId = ret.inventoryItemId.toString();
          } else if (typeof ret.inventoryItemId === 'object' && typeof ret.inventoryItemId.toJSON === 'function') {
            ret.inventoryItemId = ret.inventoryItemId.toJSON();
          }
        }
        delete ret._id;
        return ret;
      },
    },
  },
);

const inventoryCountSchema = new Schema<IInventoryCount>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(InventoryCountStatus),
      default: InventoryCountStatus.IN_PROGRESS,
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    completedAt: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    items: [inventoryCountItemSchema],
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: unknown, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        ret.shopId = ret.shopId ? ret.shopId.toString() : ret.shopId;

        if (ret.createdBy) {
          if (typeof ret.createdBy === 'object' && 'toHexString' in ret.createdBy) {
            ret.createdBy = ret.createdBy.toString();
          } else if (typeof ret.createdBy === 'object' && typeof ret.createdBy.toJSON === 'function') {
            ret.createdBy = ret.createdBy.toJSON();
          }
        }

        if (ret.completedBy) {
          if (typeof ret.completedBy === 'object' && 'toHexString' in ret.completedBy) {
            ret.completedBy = ret.completedBy.toString();
          } else if (typeof ret.completedBy === 'object' && typeof ret.completedBy.toJSON === 'function') {
            ret.completedBy = ret.completedBy.toJSON();
          }
        }

        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

inventoryCountSchema.index({ shopId: 1, status: 1 });

export const InventoryCount = mongoose.model<IInventoryCount>('InventoryCount', inventoryCountSchema);
