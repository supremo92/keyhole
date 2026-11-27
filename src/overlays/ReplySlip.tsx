import { useEffect, useState } from "react";
import type { Note } from "../../shared/types";
import { toGlyphs } from "../lib/glyphs";
import { backToRoom } from "../lib/flow";
import { sounds } from "../lib/sound";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// The Operator's reply: a typed memo that has just slid out from under the door.
// The Operator can't read, so your title is shown the way they saw it: as shapes.
export function ReplySlip({ note }: { note: Note }) {
    const reply = note.reply ?? "";
    const [typed, setTyped] = useState(0);
    const [leaving, setLeaving] = useState(false);

    // Type the reply out a few characters at a time, like a typewriter.
    useEffect(() => {
        if (typed >= reply.length) return;
        const t = setTimeout(() => {
            setTyped((n) => n + 2);
            if (typed % 8 === 0) sounds.click();
        }, 28);
        return () => clearTimeout(t);
    }, [typed, reply.length]);

    async function keepPeeking() {
        setLeaving(true);
        await sleep(450);
        await backToRoom();
    }

    return (
        <div className={`paper-stage ${leaving ? "leaving" : ""}`}>
            <div className={`memo ${leaving ? "paper-out" : "paper-in from-under"}`}>
                <div className="memo-head">MEMORANDUM</div>
                <div className="memo-row">
                    <span>FROM:</span> THE OPERATOR
                </div>
                <div className="memo-row">
                    <span>RE:</span> <span className="memo-glyphs">{toGlyphs(note.title)}</span>
                </div>
                <hr />
                <p className="memo-body">
                    {reply.slice(0, typed)}
                    {typed < reply.length && <span className="memo-caret">▌</span>}
                </p>
                <div className="memo-rule">Processed in accordance with Rule {note.replyRule}.</div>
                <div className="stamp memo-stamp" aria-hidden>
                    <strong>PROCESSED</strong>
                    <span>NOT READ</span>
                </div>
                <button className="btn" onClick={() => void keepPeeking()} disabled={leaving}>
                    Keep peeking
                </button>
            </div>
        </div>
    );
}
