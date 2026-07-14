import { Hocuspocus } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { Redis } from "@hocuspocus/extension-redis";
import { getDb } from "@eraser/database";
import { Binary } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT ? parseInt(process.env.PORT) : 1234;

const extensions: any[] = [
  new Database({
    fetch: async ({ documentName }) => {
      try {
        const parts = documentName.split("/");
        const documentId = parts[parts.length - 1];
        
        const db = await getDb();
        const doc = await db.collection("documents").findOne({ _id: documentId as any });
        
        if (doc && doc.yjsSnapshot) {
          return doc.yjsSnapshot.buffer;
        }
      } catch (err) {
        console.error("Database fetch failed for doc:", documentName, err);
      }
      return null;
    },
    store: async ({ documentName, state }) => {
      try {
        const parts = documentName.split("/");
        const documentId = parts[parts.length - 1];
        
        const db = await getDb();
        await db.collection("documents").updateOne(
          { _id: documentId as any },
          {
            $set: {
              yjsSnapshot: new Binary(Buffer.from(state)),
              updatedAt: new Date(),
            }
          },
          { upsert: true }
        );
      } catch (err) {
        console.error("Database store failed for doc:", documentName, err);
      }
    }
  })
];

// Eagerly connect Redis if defined
if (process.env.REDIS_HOST) {
  const host = process.env.REDIS_HOST;
  const port = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379;
  extensions.push(
    new Redis({
      host,
      port,
    })
  );
  console.log(`Redis extension enabled on ${host}:${port}`);
}

const server = new Hocuspocus({
  port,
  extensions,

  async onAuthenticate(data: any) {
    const { token, documentName } = data;
    if (!token) {
      throw new Error("Unauthorized: No session token provided");
    }

    const db = await getDb();

    // Verify session
    const session = await db.collection("session").findOne({ token });
    if (!session || new Date(session.expiresAt) < new Date()) {
      throw new Error("Unauthorized: Invalid or expired session token");
    }

    // Verify user
    const user = await db.collection("user").findOne({ _id: session.userId });
    if (!user) {
      throw new Error("Unauthorized: User not found");
    }

    // Optional: Membership check based on org_123/workspace_456/document_789
    const parts = documentName.split("/");
    const workspacePart = parts.find((p: string) => p.startsWith("workspace_"));
    if (workspacePart) {
      const workspaceId = workspacePart.replace("workspace_", "");
      const member = await db.collection("workspaceMembers").findOne({
        workspaceId,
        userId: session.userId,
      });
      if (!member) {
        throw new Error("Unauthorized: User is not a member of this workspace");
      }
    }

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.image,
      }
    };
  },

  async onRequest({ request, response }: any) {
    if (request.url === "/health") {
      response.writeHead(200, { "Content-Type": "application/json" });
      
      let databaseConnected = false;
      try {
        const db = await getDb();
        await db.admin().ping();
        databaseConnected = true;
      } catch (err) {
        databaseConnected = false;
      }

      response.end(JSON.stringify({
        status: "ok",
        service: "collaboration-server",
        version: "0.1.0",
        database: databaseConnected,
      }));
      throw null; // Prevent Hocuspocus from trying to upgrade this request as a WebSocket
    }
  }
});

server.listen().then(() => {
  console.log(`Hocuspocus Collaboration Server listening on port ${port}`);
});
