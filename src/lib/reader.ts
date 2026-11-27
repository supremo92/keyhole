import type { Word } from "../../shared/lexicon";
import { useView } from "../stores/view";
import { useShift } from "./api";

export type Reading = { word: Word; sure: boolean } | null;

// What a glyph means to you: certain if it's in your Phrasebook, a guess if you pencilled
// it in, otherwise nothing.
export function useReader() {
    const phrasebook = useShift(true).data?.phrasebook;
    const pencil = useView((s) => s.pencil);
    return (glyph: string): Reading => {
        const known = phrasebook?.find(([, g]) => g === glyph)?.[0];
        if (known) return { word: known, sure: true };
        const guess = pencil[glyph];
        return guess ? { word: guess, sure: false } : null;
    };
}
