import { useState } from "react";
import { ALL_WORDS, type Word } from "../../shared/lexicon";
import { useReader } from "../lib/reader";
import { useView } from "../stores/view";

// One glyph, with what it means to you underneath: inked if it's in your Phrasebook,
// pencilled if it's a guess, a question mark if you've no idea.
export function GlyphCell({ glyph, onClick, small = false, title }: { glyph: string; onClick?: () => void; small?: boolean; title?: string }) {
    const read = useReader();
    const reading = read(glyph);
    return (
        <button type="button" className={`glyph-cell ${small ? "small" : ""} ${onClick ? "" : "static"}`} onClick={onClick} disabled={!onClick} title={title}>
            <span className="glyph">{glyph}</span>
            <span className={`gloss ${reading ? (reading.sure ? "inked" : "pencilled") : "unknown"}`}>{reading ? reading.word : "?"}</span>
        </button>
    );
}

// A glyph in a note you can pencil a guess onto.
export function PencilGlyph({ glyph }: { glyph: string }) {
    const [open, setOpen] = useState(false);
    const read = useReader();
    const reading = read(glyph);
    const pencilIn = useView((s) => s.pencilIn);
    const known = reading?.sure;
    const pick = (word: Word | null) => {
        pencilIn(glyph, word);
        setOpen(false);
    };
    return (
        <span className="pencil-wrap">
            <GlyphCell glyph={glyph} onClick={known ? undefined : () => setOpen((o) => !o)} title={known ? "In your Phrasebook" : "Pencil in a guess"} />
            {open && (
                <span className="pencil-picker">
                    <span className="pencil-picker-head">What might {glyph} mean?</span>
                    <span className="pencil-words">
                        {[...ALL_WORDS].sort().map((w) => (
                            <button type="button" key={w} onClick={() => pick(w)} className={reading?.word === w ? "current" : ""}>
                                {w}
                            </button>
                        ))}
                    </span>
                    {reading && (
                        <button type="button" className="link-btn" onClick={() => pick(null)}>
                            Rub it out
                        </button>
                    )}
                </span>
            )}
        </span>
    );
}
