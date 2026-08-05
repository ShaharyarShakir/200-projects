import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT || "http://localhost:3900",
  region: process.env.AWS_REGION || "garage",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY || "placeholder",
    secretAccessKey: process.env.AWS_SECRET_KEY || "placeholder",
  },
  forcePathStyle: true,
});

export const testS3Connection = async () => {
  try {
    await s3Client.send(new ListBucketsCommand({}));
    console.log("S3/Garage Client initialized and connected successfully!");
    return true;
  } catch (error) {
    console.warn("S3/Garage initialization check warning:", error.message);
    return false;
  }
};

export default s3Client;
