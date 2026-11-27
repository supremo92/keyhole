import type { Door } from "../../shared/types";
import { VIEWS } from "../scene/layout";
import { useView } from "../stores/view";
import { sounds } from "./sound";

// Scripted camera sequences. Each step waits for the camera to (mostly) arrive.
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const view = () => useView.getState();

// Fly to the keyhole, black out, and reappear inside the room.
async function intoRoom(slot: number) {
    view().moveCam(VIEWS.keyhole(slot));
    await sleep(700);
    view().set({ blackout: true });
    await sleep(320);
    view().moveCam(VIEWS.room, true);
    view().set({ keyhole: true, mode: "peeking", noteId: null });
    await sleep(60);
    view().set({ blackout: false });
}

// From the room back to the door, looking down at the gap underneath.
async function outToDoor(slot: number) {
    view().set({ blackout: true });
    await sleep(320);
    view().set({ keyhole: false });
    view().moveCam(VIEWS.keyhole(slot), true);
    await sleep(60);
    view().set({ blackout: false });
    view().moveCam(VIEWS.doorLow(slot));
    await sleep(650);
}

export async function peek(door: Door) {
    if (view().mode !== "hallway") return;
    view().set({ mode: "moving", doorId: door.id, doorSlot: door.doorSlot });
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
    view().set({ keyhole: false });
    view().moveCam(VIEWS.keyhole(doorSlot), true);
    await sleep(60);
    view().set({ blackout: false });
    sounds.whoosh();
    view().moveCam(VIEWS.hallway);
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

export async function openNote(noteId: string) {
    const { mode, doorSlot } = view();
    if (mode !== "peeking" || doorSlot === null) return;
    view().set({ mode: "moving", noteId });
    await outToDoor(doorSlot);
    view().set({ mode: "reading" });
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
    view().moveCam(VIEWS.hallway);
    await sleep(700);
    view().set({ mode: "hallway", doorSlot: null });
}

// The new door is hung: go straight in for a first look at the empty room.
export async function doorCreated(door: Door) {
    view().set({ mode: "hallway", unboarding: null });
    await sleep(500);
    await peek(door);
}
