import crypto from "crypto";
import { uploadFile as uploadToGarage, getFileStream, deleteFile as deleteFromGarage } from "../services/storage.service.js";
import { 
  createFileInfo, 
  getUserFiles, 
  getStarredFiles, 
  getTrashFiles, 
  getFileById, 
  renameFileInfo, 
  starFileInfo, 
  softDeleteFileInfo, 
  restoreFileInfo, 
  permanentDeleteFileInfo 
} from "../services/file.service.js";

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error("No file uploaded");
      error.statusCode = 400;
      throw error;
    }

    const { originalname, mimetype, size, buffer } = req.file;
    const ownerId = req.user._id;

    // Validate size limit (50 MB)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (size > MAX_SIZE) {
      const error = new Error("File size exceeds 50 MB limit");
      error.statusCode = 400;
      throw error;
    }

    // Generate unique object key: userId/uuid/originalName
    const uuid = crypto.randomUUID();
    const objectKey = `${ownerId}/${uuid}/${originalname}`;

    // Upload file bytes to Garage S3
    const uploadResult = await uploadToGarage(objectKey, buffer, mimetype);

    // Save metadata record in MongoDB and update user storage usage
    const fileRecord = await createFileInfo({
      ownerId,
      filename: originalname,
      originalName: originalname,
      mimeType: mimetype,
      size,
      bucket: uploadResult.bucket,
      objectKey: uploadResult.objectKey,
    });

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: fileRecord,
    });
  } catch (err) {
    next(err);
  }
};

export const getFiles = async (req, res, next) => {
  try {
    const files = await getUserFiles(req.user._id);
    res.status(200).json({
      success: true,
      data: files,
    });
  } catch (err) {
    next(err);
  }
};

export const getStarredFilesList = async (req, res, next) => {
  try {
    const files = await getStarredFiles(req.user._id);
    res.status(200).json({
      success: true,
      data: files,
    });
  } catch (err) {
    next(err);
  }
};

export const getTrashFilesList = async (req, res, next) => {
  try {
    const files = await getTrashFiles(req.user._id);
    res.status(200).json({
      success: true,
      data: files,
    });
  } catch (err) {
    next(err);
  }
};

export const downloadFile = async (req, res, next) => {
  try {
    const file = await getFileById(req.params.id, req.user._id);
    if (!file) {
      const error = new Error("File not found");
      error.statusCode = 404;
      throw error;
    }

    const stream = await getFileStream(file.objectKey);
    
    res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(file.originalName)}"`
    );
    
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
};

export const previewFile = async (req, res, next) => {
  try {
    const file = await getFileById(req.params.id, req.user._id);
    if (!file) {
      const error = new Error("File not found");
      error.statusCode = 404;
      throw error;
    }

    const stream = await getFileStream(file.objectKey);
    
    res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(file.originalName)}"`
    );
    
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
};

export const renameFile = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === "") {
      const error = new Error("Name is required");
      error.statusCode = 400;
      throw error;
    }

    const file = await renameFileInfo(req.params.id, req.user._id, name.trim());
    res.status(200).json({
      success: true,
      message: "File renamed successfully",
      data: file,
    });
  } catch (err) {
    next(err);
  }
};

export const starFile = async (req, res, next) => {
  try {
    const file = await starFileInfo(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: file.isStarred ? "File starred" : "File unstarred",
      data: file,
    });
  } catch (err) {
    next(err);
  }
};

export const softDeleteFile = async (req, res, next) => {
  try {
    const file = await softDeleteFileInfo(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: "File moved to trash bin",
      data: file,
    });
  } catch (err) {
    next(err);
  }
};

export const restoreFile = async (req, res, next) => {
  try {
    const file = await restoreFileInfo(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: "File restored successfully",
      data: file,
    });
  } catch (err) {
    next(err);
  }
};

export const permanentDeleteFile = async (req, res, next) => {
  try {
    // 1. Get file details to retrieve object key
    const file = await getFileById(req.params.id, req.user._id);
    if (!file) {
      const error = new Error("File not found");
      error.statusCode = 404;
      throw error;
    }

    // 2. Delete object from Garage S3
    await deleteFromGarage(file.objectKey);

    // 3. Delete metadata record from MongoDB
    await permanentDeleteFileInfo(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: "File permanently deleted",
    });
  } catch (err) {
    next(err);
  }
};
