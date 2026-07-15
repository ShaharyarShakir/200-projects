import { MongoClient, Db } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

export const client = new MongoClient(uri);
export const db = client.db();

export async function getMongoClient(): Promise<MongoClient> {
  return client;
}

export async function getDb(): Promise<Db> {
  return db;
}
