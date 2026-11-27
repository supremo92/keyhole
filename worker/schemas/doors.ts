import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

// A door is a folder. Each user has doors in numbered slots along the hallway.
export const doors = sqliteTable(
    "doors",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        // Owner. Always set from the session on the server, never from the request.
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
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

        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .$defaultFn(() => new Date()),
    },
    (t) => [unique().on(t.userId, t.floor, t.side, t.doorSlot)],
);
