import { Schema, model, Document, Types } from 'mongoose';

export interface IRefreshTokenDocument extends Document {
  userId: Types.ObjectId | string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export const RefreshTokenModel = model<IRefreshTokenDocument>('RefreshToken', refreshTokenSchema);
