import { useEffect } from "react";
import { MAX_FURNITURE_SLOTS } from "../../shared/constants";
import { HOUSE_RULES, RULES } from "../../shared/rulebook";
import type { Note } from "../../shared/types";
import { toGlyphs } from "../lib/glyphs";
import { sounds } from "../lib/sound";
import { useView } from "../stores/view";

const close = () => {
    sounds.page();
    useView.getState().set({ mode: "peeking" });
};

// The Operator's Rulebook, open on the desk. Everything in the room "follows the rules":
// where each note went, and how the Operator answered it. None of it requires understanding.
export function RulebookOverlay({ notes }: { notes: Note[] }) {
    useEffect(() => {
        sounds.page();
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    return (
        <div className="modal-stage" onClick={close}>
            <div className="rulebook" onClick={(e) => e.stopPropagation()}>
                <section className="rulebook-page">
                    <h2>The Rulebook</h2>
                    <p className="rulebook-sub">For the use of the Operator only</p>
                    <h3>House rules</h3>
                    <ol>
                        {HOUSE_RULES.map((r) => (
                            <li key={r.no}>
                                <b>§{r.no}</b> {r.text}
                            </li>
                        ))}
                    </ol>
                    <h3>Filing</h3>
                    <ol>
                        {notes.map((n) => (
                            <li key={n.id}>
                                When the paper bears the shapes <span className="rulebook-glyphs">«{toGlyphs(n.title)}»</span>, place it{" "}
                                {n.roomSlot < MAX_FURNITURE_SLOTS ? (
                                    <>
                                        on the <b>{n.furniture.toUpperCase()}</b>.
                                    </>
                                ) : (
                                    <>
                                        on the <b>FLOOR</b>.
                                    </>
                                )}
                                {/* Someone has pencilled in a translation. It wasn't the Operator. */}
                                <span className="pencil">{n.title}</span>
                            </li>
                        ))}
                        {notes.length === 0 && <li className="rulebook-empty">No papers have arrived yet.</li>}
                    </ol>
                </section>
                <section className="rulebook-page">
                    <h3>Replying</h3>
                    <p className="rulebook-sub">Check each rule in order. Use the first one that fits.</p>
                    <ol>
                        {RULES.map((r) => (
                            <li key={r.no}>
                                <b>§{r.no}</b> {r.when} {r.says}
                            </li>
                        ))}
                    </ol>
                    <button className="btn" onClick={close}>
                        Close the book
                    </button>
                </section>
            </div>
        </div>
    );
}
