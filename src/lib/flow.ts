import type { Door, Note } from "../../shared/types";
import { VIEWS } from "../scene/layout";
import { useView } from "../stores/view";
import { notesQuery } from "./api";
import { queryClient } from "./queryClient";
import { sounds } from "./sound";

// Scripted camera sequences. Each step waits for the camera to (mostly) arrive.
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// Wait for the browser to draw a few frames (lets heavy first renders happen off-screen).
const frames = (n: number) =>
    new Promise<void>((resolve) => {
        const step = () => (--n <= 0 ? resolve() : requestAnimationFrame(step));
        requestAnimationFrame(step);
    });
const view = () => useView.getState();

const PLAIN_PAPER = "#fffdf3";
const SLIDE_MS = 1250;

// Fly to the keyhole, black out, and reappear inside the room.
// The room is only built once the screen is black, so building it (textures, shaders,
// furniture) never stutters the flight.
async function intoRoom(slot: number) {
    view().moveCam(VIEWS.keyhole(slot));
    await sleep(700);
    view().set({ blackout: true });
    await sleep(320);
    view().set({ roomId: view().doorId });
    await frames(3);
    view().moveCam(VIEWS.room, true);
    view().set({ keyhole: true, mode: "peeking", noteId: null });
    await frames(2);
    view().set({ blackout: false });
}

// From the room back to the door, looking down at the gap underneath.
async function outToDoor(slot: number) {
    view().set({ blackout: true });
    await sleep(320);
    view().set({ keyhole: false });
    view().moveCam(VIEWS.keyhole(slot), true);
    await frames(2);
    view().set({ blackout: false });
    view().moveCam(VIEWS.doorLow(slot));
    await sleep(650);
}

// A sheet of paper slides across the hallway floor, under the door or back out.
async function slidePaper(direction: "in" | "out", colour: string) {
    view().set({ slide: { direction, colour, startedAt: performance.now() } });
    sounds.slide();
    await sleep(SLIDE_MS);
    view().set({ slide: null });
}

export async function peek(door: Door) {
    if (view().mode !== "hallway") return;
    view().set({ mode: "moving", doorId: door.id, doorSlot: door.doorSlot });
    // Start loading the room's notes now, so they're ready when the room appears.
    void queryClient.prefetchQuery(notesQuery(door.id));
    sounds.whoosh();
    view().moveCam(VIEWS.doorFront(door.doorSlot));
    await sleep(750);
    await intoRoom(door.doorSlot);
}

export async function leaveRoom() {
    const { mode, doorSlot } = view();
    if (mode !== "peeking" || doorSlot === null) return;
    view().set({ mode: "moving", blackout: true });
    await sleep(320);
    view().set({ keyhole: false, roomId: null });
    view().moveCam(VIEWS.keyhole(doorSlot), true);
    await frames(2);
    view().set({ blackout: false });
    sounds.whoosh();
    view().moveCam(VIEWS.hallway(view().hallZ));
    await sleep(800);
    view().set({ mode: "hallway", doorId: null, doorSlot: null });
}

export async function startWriting() {
    const { mode, doorSlot } = view();
    if (mode !== "peeking" || doorSlot === null) return;
    view().set({ mode: "moving" });
    await outToDoor(doorSlot);
    view().set({ mode: "writing" });
}

// Take a note out: it slides out from under the door, then is picked up.
export async function openNote(noteId: string) {
    const { mode, doorSlot, doorId } = view();
    if (mode !== "peeking" || doorSlot === null) return;
    view().set({ mode: "moving", noteId });
    await outToDoor(doorSlot);
    const note = queryClient.getQueryData<Note[]>(["notes", doorId])?.find((n) => n.id === noteId);
    await slidePaper("out", note?.colour ?? PLAIN_PAPER);
    view().set({ mode: "reading" });
}

// The paper overlay has been put down on the floor: slide it under the door.
export async function slideUnderDoor(colour = PLAIN_PAPER) {
    await slidePaper("in", colour);
}

// After a note has slid under the door (or the user gave up), peek again.
export async function backToRoom() {
    const { doorSlot } = view();
    if (doorSlot === null) return;
    view().set({ mode: "moving" });
    await intoRoom(doorSlot);
}

export async function unboard(slot: number) {
    if (view().mode !== "hallway") return;
    view().set({ mode: "moving", doorSlot: slot });
    view().moveCam(VIEWS.doorFront(slot));
    await sleep(600);
    view().set({ unboarding: slot });
    sounds.crack();
    await sleep(1400);
    view().set({ mode: "naming" });
}

export async function cancelNaming() {
    view().set({ mode: "moving", unboarding: null });
    view().moveCam(VIEWS.hallway(view().hallZ));
    await sleep(700);
    view().set({ mode: "hallway", doorSlot: null });
}

// The new door is hung: go straight in for a first look at the empty room.
export async function doorCreated(door: Door) {
    view().set({ mode: "hallway", unboarding: null });
    await sleep(500);
    await peek(door);
}
