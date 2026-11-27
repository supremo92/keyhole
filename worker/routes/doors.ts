import { zValidator } from "@hono/zod-validator";
import { and, asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { operatorReply } from "../../shared/rulebook";
import { createDoorSchema, noteInputSchema } from "../../shared/schemas";
import { doors, notes } from "../schemas";
import { randomFurniture, randomPaper, randomRoomStyle } from "../lib/random";
import { seedStarterDoor } from "../lib/seed";
import { toDoor, toNote } from "../lib/serialise";
import type { AppEnv } from "../types";

export const doorRoutes = new Hono<AppEnv>()
    // List the user's doors. A brand new user gets a starter door first.
    .get("/", async (c) => {
        const db = c.get("db");
        const userId = c.get("user").id;
        const list = () =>
            db.select().from(doors).where(eq(doors.userId, userId)).orderBy(asc(doors.doorSlot));
        let rows = await list();
        if (rows.length === 0) {
            await seedStarterDoor(db, userId);
            rows = await list();
        }
        return c.json(rows.map(toDoor));
    })

    // Unboard a doorway: create a door with a random room style.
    .post("/", zValidator("json", createDoorSchema), async (c) => {
        const db = c.get("db");
        const userId = c.get("user").id;
        const { doorSlot, name } = c.req.valid("json");
        const [row] = await db
            .insert(doors)
            .values({ userId, name, doorSlot, ...randomRoomStyle() })
            .onConflictDoNothing()
            .returning();
        if (!row) return c.json({ error: "That doorway already has a door." }, 409);
        return c.json(toDoor(row), 201);
    })

    // Notes in a room. The door must belong to the user.
    .get("/:doorId/notes", async (c) => {
        const db = c.get("db");
        const userId = c.get("user").id;
        const doorId = c.req.param("doorId");
        const [door] = await db
            .select({ id: doors.id })
            .from(doors)
            .where(and(eq(doors.id, doorId), eq(doors.userId, userId)));
        if (!door) return c.json({ error: "Door not found." }, 404);
        const rows = await db
            .select()
            .from(notes)
            .where(and(eq(notes.doorId, doorId), eq(notes.userId, userId)))
            .orderBy(asc(notes.roomSlot));
        return c.json(rows.map(toNote));
    })

    // Slide a note under the door: it takes the next free slot and random furniture.
    .post("/:doorId/notes", zValidator("json", noteInputSchema), async (c) => {
        const db = c.get("db");
        const userId = c.get("user").id;
        const doorId = c.req.param("doorId");
        const { title, body } = c.req.valid("json");
        const [door] = await db
            .select({ id: doors.id })
            .from(doors)
            .where(and(eq(doors.id, doorId), eq(doors.userId, userId)));
        if (!door) return c.json({ error: "Door not found." }, 404);

        const used = await db.select({ slot: notes.roomSlot }).from(notes).where(eq(notes.doorId, doorId));
        const taken = new Set(used.map((u) => u.slot));
        let roomSlot = 0;
        while (taken.has(roomSlot)) roomSlot++;

        // The Operator answers by the Rulebook, without understanding a word.
        const reply = operatorReply(title, body);
        const [row] = await db
            .insert(notes)
            .values({
                doorId,
                userId,
                title,
                bodyFront: body,
                colour: randomPaper(),
                design: "plain",
                furniture: randomFurniture(),
                roomSlot,
                reply: reply.text,
                replyRule: reply.rule,
            })
            .returning();
        return c.json(toNote(row), 201);
    });
