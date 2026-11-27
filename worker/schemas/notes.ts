import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { doors } from "./doors";

// A note rests on a piece of furniture in a door's room.
export const notes = sqliteTable(
    "notes",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        doorId: text("door_id")
            .notNull()
            .references(() => doors.id, { onDelete: "restrict" }),
        // Denormalised owner, so ownership checks don't need a join.
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        bodyFront: text("body_front"),
        bodyBack: text("body_back"),
        colour: text("colour").notNull(),
        design: text("design").notNull(),
        furniture: text("furniture").notNull(),
        // The Operator's reply, written by following the Rulebook (shared/rulebook.ts).
        reply: text("reply"),
        replyRule: integer("reply_rule"),
        // 0-7 are furniture slots; 8+ pile up on the floor (front-end rule).
        roomSlot: integer("room_slot").notNull(),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .$defaultFn(() => new Date()),
        updatedAt: integer("updated_at", { mode: "timestamp" })
            .notNull()
            .$defaultFn(() => new Date())
            .$onUpdateFn(() => new Date()),
    },
    (t) => [unique().on(t.doorId, t.roomSlot)],
);
