import { create } from "zustand";
import { VIEWS, WALK, type View } from "../scene/layout";

// hallway: looking down the corridor. moving: camera in flight, input ignored.
// peeking: looking into a room through the keyhole. writing/reading: paper note open.
// naming: a doorway has been unboarded and needs a name.
export type Mode = "hallway" | "moving" | "peeking" | "writing" | "reading" | "naming";

type CamTarget = View & { instant: boolean; seq: number };

// A sheet of paper sliding across the hallway floor under (in) or out from under the door.
export type Slide = { direction: "in" | "out"; colour: string; startedAt: number };

type ViewState = {
    mode: Mode;
    doorId: string | null;
    doorSlot: number | null;
    // The room actually drawn (set once the screen is blacked out, see flow.intoRoom).
    roomId: string | null;
    slide: Slide | null;
    noteId: string | null;
    unboarding: number | null;
    blackout: boolean;
    keyhole: boolean;
    cam: CamTarget;
    // Where you are standing in the hallway, and what the keyhole is aimed at.
    hallZ: number;
    hoveredId: string | null;
    // A modal (the intro card) is open over the hallway: no walking.
    paused: boolean;
    // Peeking and looking down at the doormat icons (pointer visible).
    doormat: boolean;
    walkTo: (z: number) => void;
    set: (patch: Partial<Omit<ViewState, "set" | "moveCam" | "walkTo">>) => void;
    moveCam: (view: View, instant?: boolean) => void;
};

export const useView = create<ViewState>((set, get) => ({
    mode: "hallway",
    doorId: null,
    doorSlot: null,
    roomId: null,
    slide: null,
    noteId: null,
    unboarding: null,
    blackout: false,
    keyhole: false,
    cam: { ...VIEWS.hallway(WALK.start), instant: true, seq: 0 },
    hallZ: WALK.start,
    hoveredId: null,
    paused: false,
    doormat: false,
    walkTo: (z) => {
        if (get().paused) return;
        const hallZ = Math.min(WALK.max, Math.max(WALK.min, z));
        set({ hallZ, cam: { ...VIEWS.hallway(hallZ), instant: false, seq: get().cam.seq + 1 } });
    },
    set: (patch) => set(patch),
    moveCam: (view, instant = false) => set({ cam: { ...view, instant, seq: get().cam.seq + 1 } }),
}));
