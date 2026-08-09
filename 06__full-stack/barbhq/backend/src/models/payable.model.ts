import mongoose, { Schema, type Document, Types } from 'mongoose';

export enum PayableStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
}

export interface IPayable extends Document {
  shopId: Types.ObjectId;
  supplierId: Types.ObjectId;
  purchaseOrderId?: Types.ObjectId;
  amount: number;
  paidAmount: number;
  status: PayableStatus;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const payableSchema = new Schema<IPayable>(
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
    purchaseOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative'],
    },
    status: {
      type: String,
      enum: Object.values(PayableStatus),
      default: PayableStatus.UNPAID,
      required: true,
    },
    dueDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: unknown, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        ret.shopId = ret.shopId ? ret.shopId.toString() : ret.shopId;
        ret.supplierId = ret.supplierId ? ret.supplierId.toString() : ret.supplierId;
        if (ret.purchaseOrderId) {
          ret.purchaseOrderId = ret.purchaseOrderId.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

payableSchema.index({ shopId: 1, supplierId: 1 });

export const Payable = mongoose.model<IPayable>('Payable', payableSchema);
