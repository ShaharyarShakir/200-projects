import mongoose, { Schema, type Document, Types } from 'mongoose';

export enum PurchaseStatus {
  DRAFT = 'DRAFT',
  ORDERED = 'ORDERED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export interface IPurchaseOrderItem {
  _id?: Types.ObjectId;
  inventoryItemId: Types.ObjectId;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  discount: number;
  tax: number;
  total: number;
}

export interface IPurchaseOrder extends Document {
  shopId: Types.ObjectId;
  supplierId: Types.ObjectId;
  purchaseNumber: string;
  status: PurchaseStatus;
  orderDate: Date;
  expectedDate?: Date;
  items: IPurchaseOrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseOrderItemSchema = new Schema<IPurchaseOrderItem>(
  {
    inventoryItemId: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: [true, 'Inventory Item ID is required'],
    },
    quantityOrdered: {
      type: Number,
      required: [true, 'Quantity ordered is required'],
      min: [1, 'Quantity ordered must be at least 1'],
    },
    quantityReceived: {
      type: Number,
      default: 0,
      min: [0, 'Quantity received cannot be negative'],
    },
    unitCost: {
      type: Number,
      required: [true, 'Unit cost is required'],
      min: [0, 'Unit cost cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative'],
    },
    total: {
      type: Number,
      required: true,
      default: 0,
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

const purchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Supplier ID is required'],
      index: true,
    },
    purchaseNumber: {
      type: String,
      required: [true, 'Purchase number is required'],
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: Object.values(PurchaseStatus),
      default: PurchaseStatus.DRAFT,
      required: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expectedDate: {
      type: Date,
    },
    items: [purchaseOrderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
    notes: {
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

purchaseOrderSchema.index({ shopId: 1, purchaseNumber: 1 }, { unique: true });

export const PurchaseOrder = mongoose.model<IPurchaseOrder>('PurchaseOrder', purchaseOrderSchema);
