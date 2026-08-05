import crypto from "crypto";
import { uploadFile as uploadToGarage } from "../services/storage.service.js";
import { createFileInfo, getUserFiles } from "../services/file.service.js";

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
