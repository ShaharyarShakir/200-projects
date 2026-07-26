import { Hono } from "hono";
import { requireAuth } from "../../middleware/auth.js";
import { NoteService } from "./service.js";

const router = new Hono();

// Protect all note endpoints
router.use("*", requireAuth);

router.get("/", async (c) => {
  const user = (c as any).get("user");
  const result = await NoteService.list(user.id);
  return c.json(result);
});

router.get("/trash", async (c) => {
  const user = (c as any).get("user");
  const result = await NoteService.listTrash(user.id);
  return c.json(result);
});

router.get("/search", async (c) => {
  const user = (c as any).get("user");
  const q = c.req.query("q") || "";
  const result = await NoteService.search(user.id, q);
  return c.json(result);
});

router.get("/:id", async (c) => {
  const user = (c as any).get("user");
  const id = c.req.param("id");
  const result = await NoteService.get(user.id, id);
  if (!result) {
    return c.json({ error: "Note not found or access denied" }, 404);
  }
  return c.json(result);
});

router.post("/", async (c) => {
  const user = (c as any).get("user");
  const body = await c.req.json();
  if (!body.title) {
    return c.json({ error: "Note title is required" }, 400);
  }
  const result = await NoteService.create(user.id, body);
  return c.json(result);
});

router.patch("/:id", async (c) => {
  const user = (c as any).get("user");
  const id = c.req.param("id");
  const body = await c.req.json();
  const result = await NoteService.update(user.id, id, body);
  if (!result) {
    return c.json({ error: "Note not found or access denied" }, 404);
  }
  return c.json(result);
});

router.delete("/:id", async (c) => {
  const user = (c as any).get("user");
  const id = c.req.param("id");
  const result = await NoteService.softDelete(user.id, id);
  if (!result) {
    return c.json({ error: "Note not found or access denied" }, 404);
  }
  return c.json(result);
});

router.patch("/:id/restore", async (c) => {
  const user = (c as any).get("user");
  const id = c.req.param("id");
  const result = await NoteService.restore(user.id, id);
  if (!result) {
    return c.json({ error: "Note not found or access denied" }, 404);
  }
  return c.json(result);
});

router.delete("/:id/permanent", async (c) => {
  const user = (c as any).get("user");
  const id = c.req.param("id");
  const result = await NoteService.permanentDelete(user.id, id);
  if (!result) {
    return c.json({ error: "Note not found or access denied" }, 404);
  }
  return c.json(result);
});

router.patch("/:id/favorite", async (c) => {
  const user = (c as any).get("user");
  const id = c.req.param("id");
  const existing = await NoteService.get(user.id, id);
  if (!existing) {
    return c.json({ error: "Note not found or access denied" }, 404);
  }
  const result = await NoteService.update(user.id, id, {
    isFavorite: !existing.isFavorite,
  });
  return c.json(result);
});

router.patch("/:id/pin", async (c) => {
  const user = (c as any).get("user");
  const id = c.req.param("id");
  const existing = await NoteService.get(user.id, id);
  if (!existing) {
    return c.json({ error: "Note not found or access denied" }, 404);
  }
  const result = await NoteService.update(user.id, id, {
    isPinned: !existing.isPinned,
  });
  return c.json(result);
});

export default router;
