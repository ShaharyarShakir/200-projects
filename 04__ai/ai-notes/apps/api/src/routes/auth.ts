import { Hono } from "hono";
import { auth } from "../lib/auth/index.js";

const app = new Hono();

app.all("*", (c) => {
  return auth.handler(c.req.raw);
});

export default app;
