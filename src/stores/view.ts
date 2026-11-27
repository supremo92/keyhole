import { create } from "zustand";
import type { RoomId, Word } from "../../shared/lexicon";
import { VIEWS, WALK, type View } from "../scene/layout";

// hallway: walking the corridor. moving: camera in flight, input ignored.
// peeking: looking into a room through its keyhole.
// note: holding a resident's note (decoding it and building a reply).
// response: the resident's note back, after a reply.
// board / locker: reading the notice board, or your locker (the Phrasebook).
// finale: the end of the shift.
export type Mode = "hallway" | "moving" | "peeking" | "note" | "response" | "board" | "locker" | "finale";

type CamTarget = View & { instant: boolean; seq: number };

// A sheet of paper sliding across the hallway floor under (in) or out from under a door.
export type Slide = { direction: "in" | "out"; colour: string; startedAt: number };

export type Response = { glyphs: string[]; correct: boolean; learned: Word[] };

const PENCIL_KEY = "keyhole-pencil";

type ViewState = {
    mode: Mode;
    // The room whose door you're at (peeking or holding its note).
    roomId: RoomId | null;
    doorSlot: number | null;
    // The room actually drawn (set once the screen is blacked out, see flow.intoRoom).
    roomShown: RoomId | null;
    slide: Slide | null;
    // When (performance.now()) a resident started reading your reply behind the door.
    processingSince: number | null;
    response: Response | null;
    blackout: boolean;
    keyhole: boolean;
    // When (performance.now()) something last looked back through the keyhole.
    eyeAt: number | null;
    cam: CamTarget;
    hallZ: number;
    hoveredId: string | null;
    // A modal (the intro card) is open over the hallway: no walking.
    paused: boolean;
    // Peeking and looking down at the doormat icons (pointer visible).
    doormat: boolean;
    // Your pencilled guesses: glyph -> word. Kept between visits (localStorage).
    pencil: Record<string, Word>;
    // Replies you're building, per room (glyphs).
    drafts: Partial<Record<RoomId, string[]>>;
    // Odd things that happened while you weren't looking (see flow.aftermath).
    boardTilt: number;
    chairSpot: number;
    walkTo: (z: number) => void;
    set: (patch: Partial<Omit<ViewState, "set" | "moveCam" | "walkTo" | "pencilIn">>) => void;
    moveCam: (view: View, instant?: boolean) => void;
    pencilIn: (glyph: string, word: Word | null) => void;
};

const loadPencil = (): Record<string, Word> => {
    try {
        return JSON.parse(localStorage.getItem(PENCIL_KEY) ?? "{}");
    } catch {
        return {};
    }
};

export const useView = create<ViewState>((set, get) => ({
    mode: "hallway",
    roomId: null,
    doorSlot: null,
    roomShown: null,
    slide: null,
    processingSince: null,
    response: null,
    blackout: false,
    keyhole: false,
    eyeAt: null,
    cam: { ...VIEWS.hallway(WALK.start), instant: true, seq: 0 },
    hallZ: WALK.start,
    hoveredId: null,
    paused: false,
    doormat: false,
    pencil: loadPencil(),
    drafts: {},
    boardTilt: 0,
    chairSpot: 0,
    walkTo: (z) => {
        if (get().paused) return;
        const hallZ = Math.min(WALK.max, Math.max(WALK.min, z));
        set({ hallZ, cam: { ...VIEWS.hallway(hallZ), instant: false, seq: get().cam.seq + 1 } });
    },
    set: (patch) => set(patch),
    moveCam: (view, instant = false) => set({ cam: { ...view, instant, seq: get().cam.seq + 1 } }),
    pencilIn: (glyph, word) => {
        const pencil = { ...get().pencil };
        if (word) pencil[glyph] = word;
        else delete pencil[glyph];
        localStorage.setItem(PENCIL_KEY, JSON.stringify(pencil));
        set({ pencil });
    },
}));
