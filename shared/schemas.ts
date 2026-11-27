import { z } from "zod";
import { DOOR_SLOTS, LIMITS } from "./constants";

// Request bodies, validated by the Worker (and usable by the front end).
export const createDoorSchema = z.object({
    doorSlot: z.number().int().min(1).max(DOOR_SLOTS - 1),
    name: z.string().trim().min(1).max(LIMITS.doorName),
});

export const noteInputSchema = z.object({
    title: z.string().trim().min(1).max(LIMITS.noteTitle),
    body: z.string().max(LIMITS.noteBody),
});
