import { create } from "zustand";
import { VIEWS, type View } from "../scene/layout";

// hallway: looking down the corridor. moving: camera in flight, input ignored.
// peeking: looking into a room through the keyhole. writing/reading: paper note open.
// naming: a doorway has been unboarded and needs a name.
export type Mode = "hallway" | "moving" | "peeking" | "writing" | "reading" | "naming";

type CamTarget = View & { instant: boolean; seq: number };

type ViewState = {
    mode: Mode;
    doorId: string | null;
    doorSlot: number | null;
    noteId: string | null;
    unboarding: number | null;
    blackout: boolean;
    keyhole: boolean;
    cam: CamTarget;
    set: (patch: Partial<Omit<ViewState, "set" | "moveCam">>) => void;
    moveCam: (view: View, instant?: boolean) => void;
};

export const useView = create<ViewState>((set, get) => ({
    mode: "hallway",
    doorId: null,
    doorSlot: null,
    noteId: null,
    unboarding: null,
    blackout: false,
    keyhole: false,
    cam: { ...VIEWS.hallway, instant: true, seq: 0 },
    set: (patch) => set(patch),
    moveCam: (view, instant = false) => set({ cam: { ...view, instant, seq: get().cam.seq + 1 } }),
}));
