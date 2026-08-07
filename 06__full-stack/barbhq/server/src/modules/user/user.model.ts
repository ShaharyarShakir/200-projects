import { Schema, model, Document } from 'mongoose';
import type { IUser } from './user.types';

export interface IUserDocument extends IUser, Document {
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    shopId: { type: Schema.Types.ObjectId as any, ref: 'Shop', required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      required: true,
      enum: ['OWNER', 'MANAGER', 'RECEPTIONIST', 'BARBER'],
    },
    phone: { type: String, trim: true },
    avatar: { type: String, trim: true },
    isActive: { type: Boolean, required: true, default: true },
    lastLogin: { type: Date },
  },
  {
    timestamps: true,
  },
);

export const UserModel = model<IUserDocument>('User', userSchema);
