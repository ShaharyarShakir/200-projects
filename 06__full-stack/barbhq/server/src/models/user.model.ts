import { Schema, model, Document } from 'mongoose';
import type { IUser } from '../interfaces/user.interface';

export interface IUserDocument extends IUser, Document {
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'employee', 'customer'],
      default: 'customer',
    },
  },
  {
    timestamps: true,
  },
);

export const UserModel = model<IUserDocument>('User', userSchema);
