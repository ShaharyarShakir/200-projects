import { Injectable, OnModuleInit } from "@nestjs/common";
import { getMongoClient } from "@eraser/database";

@Injectable()
export class DatabaseService implements OnModuleInit {
  async onModuleInit() {
    const client = await getMongoClient();
    await client.connect();
    console.log("MongoDB Connected");

    try {
      const db = client.db();
      await db.collection("documents").createIndex({ workspaceId: 1 });
      await db.collection("documents").createIndex({ title: "text" });
      await db.collection("documents").createIndex({ tags: 1 });
      await db.collection("documents").createIndex({ folderId: 1 });
      console.log("MongoDB Indexes Created");
    } catch (err) {
      console.error("Failed to create database indexes:", err);
    }
  }
}
