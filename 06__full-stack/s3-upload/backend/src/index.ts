import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Hono } from "hono";
import { file, randomUUIDv7 } from "bun";
import { ProductModel } from "./product.model";
import { connectDB } from "./db";
import { cors } from "hono/cors";
type schema = {
  name: string;
  description: string;
  price: number;
  filename: string;
};
const app = new Hono();
connectDB();
app.use("/api/*", cors());
const client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
const createPresignedUrlWithClient = async ({
  bucket,
  key,
}: {
  bucket: string;
  key: string;
}) => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn: 3600 });
};

app.post("/api/get-presigned-url", async (c) => {
  const { mime } = await c.req.json<{
    mime: string;
  }>();
  const filename = randomUUIDv7();
  const finalName = `${filename}.${mime}`;
  // presigned url from s3
  const url = await createPresignedUrlWithClient({
    bucket: process.env.S3_BUCKET_NAME!,
    key: finalName,
  });
  // console.log("url: ", url, "finalName: ", finalName);

  return c.json({ url, finalName });
});
app.post("/api/products", async (c) => {
  const body = await c.req.json<schema>();
  // console.log("Received body:", body);

  const { name, description, price, filename } = body;

  // console.log("Parsed fields:", { name, description, price, filename });

  if (!name || !description || price == null || !filename) {
    console.log("Validation failed");
    return c.json({ error: "Missing required fields" }, 400);
  }

  const product = await ProductModel.create({
    name,
    description,
    price,
    filename,
  });

  return c.json({ message: "Success", product });
});
app.get("/api/products", async (c) => {
  const products = await ProductModel.find();
  return c.json({ products });
});
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
