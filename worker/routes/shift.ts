import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { Hono } from "hono";
import { z } from "zod";
import { glyphOf, STARTER_WORDS, wordOf, type AnswerResult, type RoomId, type ShiftState, type Word } from "../../shared/lexicon";
import { CONFUSED, PUZZLES, toGlyphs } from "../puzzles";
import { learnedWords, solvedRooms } from "../schemas";
import type { AppEnv } from "../types";

// Work out the player's night so far from what they've solved and learned.
// Rooms open one at a time: the first unsolved room is "waiting", the rest are locked.
async function loadShift(db: DrizzleD1Database, userId: string): Promise<ShiftState> {
    const [solved, learned] = await Promise.all([
        db.select({ roomId: solvedRooms.roomId }).from(solvedRooms).where(eq(solvedRooms.userId, userId)),
        db.select({ word: learnedWords.word }).from(learnedWords).where(eq(learnedWords.userId, userId)),
    ]);
    const solvedIds = new Set(solved.map((s) => s.roomId));
    let waitingGiven = false;

    const rooms = PUZZLES.map((p) => {
        const status = solvedIds.has(p.id) ? "solved" : waitingGiven ? "locked" : "waiting";
        if (status === "waiting") waitingGiven = true;
        return {
            id: p.id,
            status,
            note: status === "locked" ? null : toGlyphs(p.note),
            response: status === "solved" ? toGlyphs(p.response) : null,
            tiles: status === "waiting" ? toGlyphs(p.tiles) : null,
        } as const;
    });

    const words = new Set<Word>([...STARTER_WORDS, ...(learned.map((l) => l.word) as Word[])]);
    return {
        rooms,
        phrasebook: [...words].map((w) => [w, glyphOf(w)]),
        finished: rooms.every((r) => r.status === "solved"),
    };
}

const answerSchema = z.object({ reply: z.array(z.string().max(8)).min(1).max(8) });

export const shiftRoutes = new Hono<AppEnv>()
    .get("/shift", async (c) => c.json(await loadShift(c.get("db"), c.get("user").id)))

    // Slide a reply under a door. Only the room currently waiting can be answered.
    .post("/rooms/:roomId/answer", zValidator("json", answerSchema), async (c) => {
        const db = c.get("db");
        const userId = c.get("user").id;
        const roomId = c.req.param("roomId") as RoomId;
        const before = await loadShift(db, userId);
        const room = before.rooms.find((r) => r.id === roomId);
        if (!room) return c.json({ error: "No such room." }, 404);
        if (room.status !== "waiting") return c.json({ error: "Nobody in that room is waiting for a reply." }, 409);

        const puzzle = PUZZLES.find((p) => p.id === roomId)!;
        const reply = c.req.valid("json").reply.map(wordOf);
        const correct = reply.length === puzzle.answer.length && reply.every((w, i) => w === puzzle.answer[i]);

        if (correct) {
            await db.insert(solvedRooms).values({ userId, roomId }).onConflictDoNothing();
            await db
                .insert(learnedWords)
                .values(puzzle.learns.map((word) => ({ userId, word })))
                .onConflictDoNothing();
        }
        const result: AnswerResult = {
            correct,
            response: toGlyphs(correct ? puzzle.response : CONFUSED),
            learned: correct ? puzzle.learns : [],
            shift: correct ? await loadShift(db, userId) : before,
        };
        return c.json(result);
    });
