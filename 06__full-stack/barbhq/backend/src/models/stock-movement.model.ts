import mongoose, { Schema, type Document, Types } from 'mongoose';

export enum StockMovementType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  CONSUMPTION = 'CONSUMPTION',
  ADJUSTMENT_IN = 'ADJUSTMENT_IN',
  ADJUSTMENT_OUT = 'ADJUSTMENT_OUT',
  RETURN = 'RETURN',
  DAMAGE = 'DAMAGE',
  EXPIRED = 'EXPIRED',
}

export interface IStockMovement extends Document {
  shopId: Types.ObjectId;
  inventoryItemId: Types.ObjectId;
  type: StockMovementType;
  quantity: number;
  unitCost?: number;
  previousQuantity: number;
  newQuantity: number;
  referenceType?: string;
  referenceId?: Types.ObjectId;
  reason?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const stockMovementSchema = new Schema<IStockMovement>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    inventoryItemId: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: [true, 'Inventory Item ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(StockMovementType),
      required: [true, 'Movement type is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
    },
    unitCost: {
      type: Number,
      default: 0,
    },
    previousQuantity: {
      type: Number,
      required: true,
    },
    newQuantity: {
      type: Number,
      required: true,
    },
    referenceType: {
      type: String,
      trim: true,
      default: '',
    },
    referenceId: {
      type: Schema.Types.ObjectId,
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
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc: unknown, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        ret.shopId = ret.shopId ? ret.shopId.toString() : ret.shopId;

        if (ret.inventoryItemId) {
          if (typeof ret.inventoryItemId === 'object' && 'toHexString' in ret.inventoryItemId) {
            ret.inventoryItemId = ret.inventoryItemId.toString();
          } else if (typeof ret.inventoryItemId === 'object' && typeof ret.inventoryItemId.toJSON === 'function') {
            ret.inventoryItemId = ret.inventoryItemId.toJSON();
          }
        }

        if (ret.referenceId) {
          ret.referenceId = ret.referenceId.toString();
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

stockMovementSchema.index({ shopId: 1, inventoryItemId: 1, createdAt: -1 });

export const StockMovement = mongoose.model<IStockMovement>('StockMovement', stockMovementSchema);
