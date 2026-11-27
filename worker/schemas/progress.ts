import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

// A player's progress through the night shift. The puzzles themselves live in code
// (worker/puzzles.ts); the database only remembers what each player has done.

// Rooms whose resident has been answered correctly.
export const solvedRooms = sqliteTable(
    "solved_rooms",
    {
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        roomId: text("room_id").notNull(),
        solvedAt: integer("solved_at", { mode: "timestamp" })
            .notNull()
            .$defaultFn(() => new Date()),
    },
    (t) => [primaryKey({ columns: [t.userId, t.roomId] })],
);

// Glyphs the player has worked out: their Phrasebook.
export const learnedWords = sqliteTable(
    "learned_words",
    {
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        word: text("word").notNull(),
        learnedAt: integer("learned_at", { mode: "timestamp" })
            .notNull()
            .$defaultFn(() => new Date()),
    },
    (t) => [primaryKey({ columns: [t.userId, t.word] })],
);
