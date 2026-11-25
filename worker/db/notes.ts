import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { doors } from "./doors";

// A door is a folder. Each user has doors in numbered slots on the hallway wall.

export const notes = sqliteTable(
    "notes",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        doorId: text("door_id")
            .references(() => doors.id, { onDelete: "restrict" })
            .notNull(),
        userId: text("user_id").notNull(),
        title: text("title").notNull(),
        bodyFront: text("body_front"),
        bodyBack: text("body_back"),
        colour: text("colour").notNull(),
        design: text("design").notNull(),
        furniture: text("furniture").notNull(),
        roomSlot: integer("room_slot").notNull(),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .$defaultFn(() => new Date()),
        updatedAt: integer("updated_at", { mode: "timestamp" })
            .notNull()
            .$onUpdateFn(() => new Date()),
    },
    (t) => [
        unique().on(t.doorId, t.roomSlot),
    ],
);
