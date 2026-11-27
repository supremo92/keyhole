import { MAX_FURNITURE_SLOTS } from "../../shared/constants";
import type { Note } from "../../shared/types";

// The building's cat. Each time you peek it is in one of a few moods:
//   sleep: curled up asleep on one of your notes.
//   stare: sitting very still, staring straight back at the keyhole.
//   knock: sitting next to a note, then (while looking at you) swatting it off the furniture.
export type CatMood = "sleep" | "stare" | "knock";

export type CatCoat = { fur: string; dark: string; eyes: string };
export const CAT_COATS: CatCoat[] = [
    { fur: "#d9822b", dark: "#a85a17", eyes: "#9be05a" }, // ginger
    { fur: "#2a2522", dark: "#151210", eyes: "#f2d03b" }, // black
    { fur: "#8d8a86", dark: "#5f5c58", eyes: "#7fd0e8" }, // grey
    { fur: "#efe7da", dark: "#c9bca8", eyes: "#6cb4f0" }, // white
];

// What the cat is up to on this visit. Chosen once per peek.
export type CatPlan = { mood: CatMood; coat: CatCoat; noteId: string | null };
// knock mood: waiting, then swatting, then the note has been knocked to the floor.
export type CatPhase = "waiting" | "swatting" | "knocked";

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

export function pickCatPlan(notes: Note[]): CatPlan {
    const coat = pick(CAT_COATS);
    const onFurniture = notes.filter((n) => n.roomSlot < MAX_FURNITURE_SLOTS);
    // Too small (stool) or too soft (armchair) to sit beside a note on.
    const knockable = onFurniture.filter((n) => n.furniture !== "stool" && n.furniture !== "armchair");
    const moods: CatMood[] = ["stare"];
    if (onFurniture.length) moods.push("sleep", "sleep");
    if (knockable.length) moods.push("knock", "knock");
    // ?cat=sleep (or stare, knock) in the URL forces a mood, for testing and demo videos.
    const forced = new URLSearchParams(location.search).get("cat") as CatMood | null;
    const mood = forced && moods.includes(forced) ? forced : pick(moods);
    const noteId = mood === "sleep" ? pick(onFurniture).id : mood === "knock" ? pick(knockable).id : null;
    return { mood, coat, noteId };
}
