import File from "../models/File.js";
import User from "../models/User.js";

export const createFileInfo = async ({ ownerId, filename, originalName, mimeType, size, bucket, objectKey }) => {
  const user = await User.findById(ownerId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.storageUsed + size > user.storageQuota) {
    const error = new Error("Storage quota exceeded");
    error.statusCode = 400;
    throw error;
  }

  const file = new File({
    ownerId,
    filename,
    originalName,
    mimeType,
    size,
    bucket,
    objectKey,
  });

  await file.save();

  await User.findByIdAndUpdate(ownerId, {
    $inc: { storageUsed: size },
  });

  return file;
};

export const getUserFiles = async (ownerId) => {
  return File.find({ ownerId, isDeleted: false }).sort({ createdAt: -1 });
};
