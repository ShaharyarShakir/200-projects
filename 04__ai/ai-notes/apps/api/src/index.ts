import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { APP_NAME } from "@repo/shared";
import health from "./routes/health.js";
import dbRoute from "./routes/db.js";
import authRoute from "./routes/auth.js";
import { requireAuth } from "./middleware/auth.js";

const app = new Hono();

// Enable CORS globally for SvelteKit client
app.use(
  "*",
  cors({
    origin: "http://localhost:5173",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

