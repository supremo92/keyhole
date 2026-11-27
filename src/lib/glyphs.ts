import { useEffect, useState } from "react";

// The building's own "alphabet": made-up shapes the Operator matches without understanding.
// (Deliberately invented symbols, not a real writing system.)
const GLYPHS = "⌬⍟⏃⏚⍜⌇⎍⏁⟒⋏⊑⋔⍀⟟⌖⍙⎅⏆⟊⌰⍦⎊⏧⟁";

export const glyphFor = (ch: string, salt = 0) =>
    /\s/.test(ch) ? ch : GLYPHS[(ch.charCodeAt(0) * 7 + salt) % GLYPHS.length];

// Turn text into symbols (spaces kept, so it still has the shape of words).
export const toGlyphs = (text: string) => [...text].map((c, i) => glyphFor(c, i)).join("");

// While active, the text starts as symbols that flicker, then resolves into real letters
// from left to right: the moment a note becomes readable (to you, not the room).
export function useDecipher(text: string, active: boolean, duration = 650) {
    const [shown, setShown] = useState(text);
    useEffect(() => {
        if (!active) return;
        const start = performance.now();
        let frame = 0;
        const tick = () => {
            const t = Math.min(1, (performance.now() - start) / duration);
            const solved = Math.floor(t * text.length);
            const flicker = Math.floor(performance.now() / 60);
            setShown([...text].map((c, i) => (i < solved ? c : glyphFor(c, i + flicker))).join(""));
            if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [text, active, duration]);
    return active ? shown : toGlyphs(text);
}
