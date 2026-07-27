import { type Context, type Next } from "hono";

const requests = new Map<string, number[]>();

export const rateLimit = (limit = 20, windowMs = 60000) => {
  return async (c: Context, next: Next) => {
    const user = (c as any).get("user");
    const userId = user?.id || c.req.header("x-forwarded-for") || "ip-anonymous";
    const now = Date.now();

    let timestamps = requests.get(userId) || [];
    // Filter out timestamps older than windowMs
    timestamps = timestamps.filter((t) => now - t < windowMs);

    if (timestamps.length >= limit) {
      return c.json(
        {
          success: false,
          error: "Too many requests. Please try again later.",
        },
        429,
      );
    }

    timestamps.push(now);
    requests.set(userId, timestamps);

    await next();
  };
};
