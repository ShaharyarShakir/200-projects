import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { APP_NAME } from "@repo/shared";
import health from "./routes/health.js";
import dbRoute from "./routes/db.js";
import authRoute from "./routes/auth.js";
import notebooksRoute from "./modules/notebook/routes.js";
import notesRoute from "./modules/note/routes.js";
import { requireAuth } from "./middleware/auth.js";
import aiRoutes from './modules/ai/routes.js';

const app = new Hono();

// Enable CORS globally for SvelteKit client
app.use(
  "*",
  cors({
    origin: "http://localhost:5173",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
  }),
);

console.log(APP_NAME);
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/health", health);
app.route("/db", dbRoute);
app.route("/api/auth", authRoute);
app.route("/api/notebooks", notebooksRoute);
app.route("/api/notes", notesRoute);
app.route('/api/ai', aiRoutes);
// Test protected route
app.get("/api/me", requireAuth, (c) => {
  const user = (c as any).get("user");
  return c.json(user);
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
