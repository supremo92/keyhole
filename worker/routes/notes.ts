import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { noteInputSchema } from "../../shared/schemas";
import { notes } from "../schemas";
import { toNote } from "../lib/serialise";
import type { AppEnv } from "../types";

export const noteRoutes = new Hono<AppEnv>()
    // Edit a note (slid back under the door).
    .patch("/:noteId", zValidator("json", noteInputSchema), async (c) => {
        const db = c.get("db");
        const userId = c.get("user").id;
        const { title, body } = c.req.valid("json");
        const [row] = await db
            .update(notes)
            .set({ title, bodyFront: body })
            .where(and(eq(notes.id, c.req.param("noteId")), eq(notes.userId, userId)))
            .returning();
        if (!row) return c.json({ error: "Note not found." }, 404);
        return c.json(toNote(row));
    });
