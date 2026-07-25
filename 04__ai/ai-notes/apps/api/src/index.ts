import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { APP_NAME } from "@repo/shared";
import health from "./routes/health.js";
import dbRoute from "./routes/db.js";

const app = new Hono();

console.log(APP_NAME);
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/health", health);
app.route("/db", dbRoute);

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
