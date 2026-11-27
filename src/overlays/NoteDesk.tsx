import { useEffect, useState } from "react";
import type { RoomId, ShiftState } from "../../shared/lexicon";
import { useAnswer } from "../lib/api";
import { peekFromNote, putNoteDown, sendReply } from "../lib/flow";
import { sounds } from "../lib/sound";
import { roomDef } from "../scene/rooms";
import { useView } from "../stores/view";
import { GlyphCell, PencilGlyph } from "./Glyph";

// "Slid under the door at..." Always the small hours.
const TIMES = ["2:13 a.m.", "3:07 a.m.", "1:58 a.m.", "3:33 a.m."];
const NO_DRAFT: string[] = [];

// Holding a resident's note: work out what it says, then build a reply from glyph tiles
// and slide it back under the door. You can go and peek for clues at any point.
export function NoteDesk({ roomId, shift }: { roomId: RoomId; shift: ShiftState }) {
    const room = shift.rooms.find((r) => r.id === roomId)!;
    const def = roomDef(roomId);
    // (The fallback stays outside the selector: a new [] each time would re-render forever.)
    const draft = useView((s) => s.drafts[roomId]) ?? NO_DRAFT;
    // Always change the latest draft in the store (two quick clicks must both count).
    const changeDraft = (change: (current: string[]) => string[]) => {
        const { drafts, set } = useView.getState();
        set({ drafts: { ...drafts, [roomId]: change(drafts[roomId] ?? NO_DRAFT) } });
    };
    const answer = useAnswer();
    const [leaving, setLeaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const time = TIMES[["flat", "party", "office", "quiet"].indexOf(roomId)];

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") void leave(putNoteDown);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    async function leave(then: () => Promise<void>) {
        setLeaving(true);
        await new Promise((r) => setTimeout(r, 350));
        await then();
    }

    async function slideUnder() {
        setError(null);
        setLeaving(true);
        await new Promise((r) => setTimeout(r, 350));
        try {
            await sendReply(() => answer.mutateAsync({ roomId, reply: draft }));
        } catch (err) {
            setLeaving(false);
            useView.getState().set({ mode: "note" });
            setError(err instanceof Error ? err.message : "The reply wouldn't go under the door.");
        }
    }

    return (
        <div className={`paper-stage ${leaving ? "leaving" : ""}`}>
            <div className={`note-desk ${leaving ? "paper-out" : "paper-in from-under"}`}>
                <header>
                    <h2>A note from Room {def.plate}</h2>
                    <p className="desk-sub">Slid under the door at {time}</p>
                </header>

                <section>
                    <h3>The note</h3>
                    <div className="glyph-row big">
                        {room.note!.map((g, i) => (
                            <PencilGlyph key={i} glyph={g} />
                        ))}
                    </div>
                    <p className="desk-tip">Click a symbol you don't know to pencil in a guess. Peeking through the keyhole may help.</p>
                </section>

                <section>
                    <h3>Your reply</h3>
                    <div className="glyph-row reply">
                        {draft.length === 0 && <em className="desk-empty">Click the tiles below to write a reply in their script</em>}
                        {draft.map((g, i) => (
                            <GlyphCell key={i} glyph={g} onClick={() => changeDraft((d) => d.filter((_, j) => j !== i))} title="Take this one out" />
                        ))}
                    </div>
                    <div className="glyph-row tiles">
                        {room.tiles!.map((g) => (
                            <GlyphCell
                                key={g}
                                glyph={g}
                                small
                                onClick={() => {
                                    sounds.click();
                                    changeDraft((d) => (d.length < 6 ? [...d, g] : d));
                                }}
                            />
                        ))}
                    </div>
                </section>

                {error && <p className="paper-error">{error}</p>}

                <div className="paper-actions">
                    <button className="btn ghost" onClick={() => void leave(putNoteDown)} disabled={leaving}>
                        Put it down
                    </button>
                    <span className="game-actions-right">
                        <button className="btn ghost" onClick={() => changeDraft((d) => d.slice(0, -1))} disabled={leaving || draft.length === 0}>
                            Rub out the last one
                        </button>
                        <button className="btn ghost" onClick={() => void leave(peekFromNote)} disabled={leaving}>
                            Peek through the keyhole
                        </button>
                        <button className="btn" onClick={() => void slideUnder()} disabled={leaving || draft.length === 0}>
                            Slide it under the door
                        </button>
                    </span>
                </div>
            </div>
        </div>
    );
}
