import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    storageUsed: {
      type: Number,
      default: 0, // in bytes
    },
    storageQuota: {
      type: Number,
      default: 5368709120, // 5 GB in bytes
    },
  },
  {
    timestamps: true,
  }
);

// Strip passwordHash when converting to JSON
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.passwordHash;
  return userObject;
};

const User = mongoose.model("User", userSchema);
export default User;
