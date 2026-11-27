import type { AnswerResult, RoomId } from "../../shared/lexicon";
import { VIEWS } from "../scene/layout";
import { roomDef } from "../scene/rooms";
import { useView } from "../stores/view";
import { getShift, resetShift } from "./api";
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

export const NOTE_PAPER = "#efe9d8";
const SLIDE_MS = 1250;

// Fly to the keyhole, black out, and reappear inside the room.
// The room is only built once the screen is black, so building it never stutters the flight.
async function intoRoom(id: RoomId) {
    const { slot } = roomDef(id);
    view().moveCam(VIEWS.keyhole(slot));
    await sleep(700);
    view().set({ blackout: true });
    await sleep(320);
    view().set({ roomShown: id });
    await frames(3);
    view().moveCam(VIEWS.room, true);
    view().set({ keyhole: true, mode: "peeking" });
    await frames(2);
    view().set({ blackout: false });
    // In the quiet room, something sometimes looks back.
    if (id === "quiet" && Math.random() < 0.5) {
        await sleep(300);
        view().set({ eyeAt: performance.now() });
        sounds.gasp();
    }
}

// From the keyhole back out to the door, looking down at the gap underneath.
async function outToDoor(id: RoomId) {
    const { slot } = roomDef(id);
    view().set({ blackout: true });
    await sleep(320);
    view().set({ keyhole: false, roomShown: null });
    view().moveCam(VIEWS.keyhole(slot), true);
    await frames(2);
    view().set({ blackout: false });
    view().moveCam(VIEWS.doorLow(slot));
    await sleep(650);
}

async function slidePaper(direction: "in" | "out") {
    view().set({ slide: { direction, colour: NOTE_PAPER, startedAt: performance.now() } });
    sounds.slide();
    await sleep(SLIDE_MS);
    view().set({ slide: null });
}

async function toHallway() {
    view().set({ mode: "moving" });
    sounds.whoosh();
    view().moveCam(VIEWS.hallway(view().hallZ));
    await sleep(800);
    view().set({ mode: "hallway", roomId: null, doorSlot: null });
}

// Click a door: peek through its keyhole.
export async function peek(id: RoomId) {
    if (view().mode !== "hallway") return;
    const { slot } = roomDef(id);
    view().set({ mode: "moving", roomId: id, doorSlot: slot });
    sounds.whoosh();
    view().moveCam(VIEWS.doorFront(slot));
    await sleep(750);
    await intoRoom(id);
}

// Leave the keyhole and step back into the hallway. While you were looking, something
// may have happened out here.
export async function leaveRoom() {
    const { mode, roomId } = view();
    if (mode !== "peeking" || !roomId) return;
    view().set({ mode: "moving" });
    await outToDoor(roomId);
    aftermath();
    await toHallway();
}

// Things change while you're peeking. You never see it happen, only what's different after.
function aftermath() {
    // Sometimes the cat is out here when you come back, staring. Next time it's gone.
    view().set({ hallCat: Math.random() < 0.3 ? Math.floor(Math.random() * 3) : null });
    const roll = Math.random();
    if (roll < 0.3) {
        // Something knocked the notice board.
        view().set({ boardTilt: (Math.random() - 0.5) * 0.25 });
        sounds.thud();
    } else if (roll < 0.55) {
        // The hallway chair is somewhere else.
        view().set({ chairSpot: (view().chairSpot + 1 + Math.floor(Math.random() * 2)) % 3 });
        sounds.scrape();
    }
}

// Pick up the note lying outside a door.
export async function openNote(id: RoomId) {
    if (view().mode !== "hallway") return;
    const { slot } = roomDef(id);
    view().set({ mode: "moving", roomId: id, doorSlot: slot });
    sounds.whoosh();
    view().moveCam(VIEWS.doorLow(slot));
    await sleep(700);
    sounds.slide();
    view().set({ mode: "note" });
}

// Holding the note, take a look through the keyhole for clues.
export async function peekFromNote() {
    const { mode, roomId } = view();
    if (mode !== "note" || !roomId) return;
    view().set({ mode: "moving" });
    await intoRoom(roomId);
}

// From the keyhole (the letter on the doormat), back to the note.
export async function backToNote() {
    const { mode, roomId } = view();
    if (mode !== "peeking" || !roomId) return;
    view().set({ mode: "moving" });
    await outToDoor(roomId);
    view().set({ mode: "note" });
}

export async function putNoteDown() {
    if (view().mode !== "note") return;
    await toHallway();
}

// Slide your reply under the door. Behind it: lamplight, footsteps, a long pause...
// and then the resident's note back.
export async function sendReply(send: () => Promise<AnswerResult>) {
    const { roomId } = view();
    if (!roomId) return;
    view().set({ mode: "moving" });
    const answer = send();
    await sleep(350);
    await slidePaper("in");
    view().set({ processingSince: performance.now() });
    sounds.shuffle();
    const [result] = await Promise.all([answer, sleep(2300)]);
    view().set({ processingSince: null });
    // Pleased knocks; or, for a wrong reply, one of several kinds of disappointment.
    if (result.correct) sounds.knock(3, true);
    else [() => sounds.knock(1, false), sounds.thud, sounds.sigh][Math.floor(Math.random() * 3)]();
    await sleep(500);
    await slidePaper("out");
    view().set({
        mode: "response",
        response: { glyphs: result.response, correct: result.correct, learned: result.learned },
        drafts: result.correct ? { ...view().drafts, [roomId]: [] } : view().drafts,
    });
}

// Done reading their note back. Wrong: try again. Right: back to the hallway, where the
// next resident's note slides out from under their door. All four answered: the end.
export async function afterResponse() {
    const { response } = view();
    view().set({ response: null });
    if (!response?.correct) {
        view().set({ mode: "note" });
        return;
    }
    await toHallway();
    if (getShift()?.finished) {
        await sleep(600);
        view().set({ mode: "finale" });
    }
}

export async function openBoard() {
    if (view().mode !== "hallway") return;
    view().set({ mode: "moving" });
    view().moveCam(VIEWS.board);
    await sleep(700);
    view().set({ mode: "board" });
}

export async function openLocker() {
    if (view().mode !== "hallway") return;
    view().set({ mode: "moving" });
    sounds.locker();
    view().moveCam(VIEWS.locker);
    await sleep(600);
    view().set({ mode: "locker" });
}

// Start the night again from Room 1: progress, guesses and drafts all forgotten.
export async function newNight() {
    await resetShift();
    localStorage.removeItem("keyhole-pencil");
    view().set({ pencil: {}, drafts: {}, hallCat: null, boardTilt: 0 });
    await toHallway();
}

export async function closeReading() {
    const { mode } = view();
    if (mode !== "board" && mode !== "locker" && mode !== "finale") return;
    await toHallway();
}
