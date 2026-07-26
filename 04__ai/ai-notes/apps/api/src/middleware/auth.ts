import { type Context, type Next } from "hono";
import { auth } from "../lib/auth/index.js";

export const requireAuth = async (c: Context, next: Next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json(
      {
        error: "Unauthorized",
      },
      401,
    );
  }

  c.set("user", session.user);
  c.set("session", session.session);

  await next();
};
