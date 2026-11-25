import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

// A door is a folder. Each user has doors in numbered slots on the hallway wall.
export const doors = sqliteTable(
    "doors",
    {
        // Text IDs, generated in code (crypto.randomUUID() works in Workers).
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        // Who owns this door. Becomes a foreign key to Better Auth's `user` table
        // once those tables exist.
        userId: text("user_id").notNull(),
        name: text("name").notNull(),
        colour: text("colour").notNull(),

        // Where the door sits in the building.
        floor: integer("floor").notNull().default(0),
        side: text("side").notNull().default("front"),
        doorSlot: integer("door_slot").notNull(),

        // Random room style, generated server-side when the door is created.
        design: text("design").notNull(),
        wallpaper: text("wallpaper").notNull(),
        carpetColour: text("carpet_colour").notNull(),
        windowLayout: text("window_layout").notNull(), // JSON string

        // SQLite has no date type: stored as integer seconds, exposed as a Date.
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .$defaultFn(() => new Date()),
    },
    (t) => [
        // One user can't have two doors in the same spot.
        unique().on(t.userId, t.floor, t.side, t.doorSlot),
    ],
);

