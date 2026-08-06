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

export const getStarredFiles = async (ownerId) => {
  return File.find({ ownerId, isStarred: true, isDeleted: false }).sort({ createdAt: -1 });
};

export const getTrashFiles = async (ownerId) => {
  return File.find({ ownerId, isDeleted: true }).sort({ createdAt: -1 });
};

export const getFileById = async (id, ownerId) => {
  return File.findOne({ _id: id, ownerId });
};

export const renameFileInfo = async (id, ownerId, newName) => {
  const file = await File.findOne({ _id: id, ownerId, isDeleted: false });
  if (!file) {
    const error = new Error("File not found");
    error.statusCode = 404;
    throw error;
  }
  file.filename = newName;
  file.originalName = newName;
  await file.save();
  return file;
};

export const starFileInfo = async (id, ownerId) => {
  const file = await File.findOne({ _id: id, ownerId, isDeleted: false });
  if (!file) {
    const error = new Error("File not found");
    error.statusCode = 404;
    throw error;
  }
  file.isStarred = !file.isStarred;
  await file.save();
  return file;
};

export const softDeleteFileInfo = async (id, ownerId) => {
  const file = await File.findOne({ _id: id, ownerId, isDeleted: false });
  if (!file) {
    const error = new Error("File not found");
    error.statusCode = 404;
    throw error;
  }
  file.isDeleted = true;
  await file.save();

  // Release storage quota when soft deleted
  await User.findByIdAndUpdate(ownerId, {
    $inc: { storageUsed: -file.size },
  });

  return file;
};

export const restoreFileInfo = async (id, ownerId) => {
  const file = await File.findOne({ _id: id, ownerId, isDeleted: true });
  if (!file) {
    const error = new Error("File not found in trash");
    error.statusCode = 404;
    throw error;
  }

  // Check quota before restoring
  const user = await User.findById(ownerId);
  if (user.storageUsed + file.size > user.storageQuota) {
    const error = new Error("Cannot restore: storage quota would be exceeded");
    error.statusCode = 400;
    throw error;
  }

  file.isDeleted = false;
  await file.save();

  // Re-add to storage usage
  await User.findByIdAndUpdate(ownerId, {
    $inc: { storageUsed: file.size },
  });

  return file;
};

export const permanentDeleteFileInfo = async (id, ownerId) => {
  // Can delete from either active or trash
  const file = await File.findOne({ _id: id, ownerId });
  if (!file) {
    const error = new Error("File not found");
    error.statusCode = 404;
    throw error;
  }

  // If it was not soft-deleted previously, decrement storage used now
  if (!file.isDeleted) {
    await User.findByIdAndUpdate(ownerId, {
      $inc: { storageUsed: -file.size },
    });
  }

  await File.deleteOne({ _id: id });
  return file;
};

