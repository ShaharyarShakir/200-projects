import { Hono } from "hono";
import { requireAuth } from "../../middleware/auth.js";
import { NotebookService } from "./service.js";

const router = new Hono();

// Enforce authentication for all notebook endpoints
router.use("*", requireAuth);

router.get("/", async (c) => {
  const user = (c as any).get("user");
  const result = await NotebookService.list(user.id);
  return c.json(result);
});

router.post("/", async (c) => {
  const user = (c as any).get("user");
  const body = await c.req.json();
  if (!body.name) {
    return c.json({ error: "Notebook name is required" }, 400);
  }
  const result = await NotebookService.create(user.id, body);
  return c.json(result);
});

router.patch("/:id", async (c) => {
  const user = (c as any).get("user");
  const id = c.req.param("id");
  const body = await c.req.json();
  const result = await NotebookService.update(user.id, id, body);
  if (!result) {
    return c.json({ error: "Notebook not found or access denied" }, 404);
  }
  return c.json(result);
});

router.delete("/:id", async (c) => {
  const user = (c as any).get("user");
  const id = c.req.param("id");
  const result = await NotebookService.delete(user.id, id);
  if (!result) {
    return c.json({ error: "Notebook not found or access denied" }, 404);
  }
  return c.json(result);
});

export default router;
