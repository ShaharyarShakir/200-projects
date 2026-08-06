import { S3Client, ListBucketsCommand, CreateBucketCommand, HeadBucketCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT || "http://localhost:3900",
  region: process.env.AWS_REGION || "garage",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY || "placeholder",
    secretAccessKey: process.env.AWS_SECRET_KEY || "placeholder",
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.AWS_BUCKET || "nimbus-drive";

export const ensureBucketExists = async () => {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    console.log(`S3/Garage Bucket '${BUCKET_NAME}' already exists.`);
  } catch (err) {
    // If bucket doesn't exist, code is usually 'NotFound' or status code 404
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      console.log(`Bucket '${BUCKET_NAME}' not found. Creating bucket...`);
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
        console.log(`S3/Garage Bucket '${BUCKET_NAME}' created successfully.`);
      } catch (createErr) {
        console.error(`Error creating bucket '${BUCKET_NAME}':`, createErr.message);
      }
    } else {
      console.warn("HeadBucket check failed with unexpected error:", err.message);
    }
  }
};

export const testS3Connection = async () => {
  try {
    await s3Client.send(new ListBucketsCommand({}));
    console.log("S3/Garage Client initialized and connected successfully!");
    await ensureBucketExists();
    return true;
  } catch (error) {
    console.warn("S3/Garage initialization check warning:", error.message);
    return false;
  }
};

export const uploadFile = async (objectKey, buffer, mimeType) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);
  return {
    bucket: BUCKET_NAME,
    objectKey,
  };
};

export const getFileStream = async (objectKey) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
  });
  const response = await s3Client.send(command);
  return response.Body;
};

export const deleteFile = async (objectKey) => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
  });
  await s3Client.send(command);
};

export default s3Client;
