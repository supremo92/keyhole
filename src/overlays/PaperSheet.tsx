import { useEffect, useRef, useState } from "react";
import { LIMITS } from "../../shared/constants";
import type { Note } from "../../shared/types";
import { useCreateNote, useUpdateNote } from "../lib/api";
import { awaitReply, backToRoom, slideUnderDoor } from "../lib/flow";
import { sounds } from "../lib/sound";

type Props = { mode: "write"; doorId: string } | { mode: "read"; doorId: string; note: Note };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Every note that comes out from under the door has been through the Operator's hands,
// and stamped. Now and then the stamp is more honest than usual.
function Stamp({ note }: { note: Note }) {
    const honest = [...note.id].reduce((h, c) => h + c.charCodeAt(0), 0) % 4 === 0;
    const date = new Date(note.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
    return (
        <div className={honest ? "stamp stamp-honest" : "stamp"} aria-hidden>
            <strong>{honest ? "NOT UNDERSTOOD" : "FILED"}</strong>
            <span>{honest ? "BUT FILED ANYWAY" : date}</span>
        </div>
    );
}

// The paper note: typed on, then slid under the door (or slid out, edited and slid back).
export function PaperSheet(props: Props) {
    const existing = props.mode === "read" ? props.note : null;
    const [title, setTitle] = useState(existing?.title ?? "");
    const [body, setBody] = useState(existing?.body ?? "");
    const [phase, setPhase] = useState<"in" | "out">("in");
    const [error, setError] = useState<string | null>(null);
    const createNote = useCreateNote();
    const updateNote = useUpdateNote();
    const titleRef = useRef<HTMLInputElement>(null);
    const busy = phase === "out" || createNote.isPending || updateNote.isPending;

    useEffect(() => {
        // Reading: the sliding-out sound already played as the paper came out from under the door.
        if (props.mode === "write") {
            sounds.slide();
            titleRef.current?.focus();
        }
    }, [props.mode]);

    // Put the paper down on the floor (it drops out of view), then slide it under the door.
    // A note that was just saved gets processed, and the Operator replies.
    async function putDownAndSlide(saved?: Note) {
        setPhase("out");
        await sleep(450);
        await slideUnderDoor(saved?.colour ?? existing?.colour);
        if (saved?.reply) await awaitReply(saved.id);
        else await backToRoom();
    }

    async function slideUnder() {
        if (!title.trim()) {
            setError("Give it a title first.");
            return;
        }
        setError(null);
        try {
            const changed = !existing || existing.title !== title || existing.body !== body;
            const saved = !changed
                ? undefined
                : existing
                  ? await updateNote.mutateAsync({ id: existing.id, title, body })
                  : await createNote.mutateAsync({ doorId: props.doorId, title, body });
            await putDownAndSlide(saved);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't save the note.");
        }
    }

    async function giveUp() {
        // A note that was taken out goes back under the door; a new one is just dropped.
        if (existing) return putDownAndSlide();
        setPhase("out");
        await sleep(450);
        await backToRoom();
    }

    return (
        <div className={`paper-stage ${phase === "out" ? "leaving" : ""}`}>
            <form
                className={`paper paper-${phase} ${existing ? "from-under" : ""}`}
                style={{ background: existing?.colour ?? "#fffdf3" }}
                onSubmit={(e) => {
                    e.preventDefault();
                    void slideUnder();
                }}
            >
                <input
                    ref={titleRef}
                    className="paper-title"
                    placeholder="Title"
                    value={title}
                    maxLength={LIMITS.noteTitle}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={busy}
                />
                <textarea
                    className="paper-body"
                    placeholder="Write your note..."
                    value={body}
                    maxLength={LIMITS.noteBody}
                    onChange={(e) => setBody(e.target.value)}
                    disabled={busy}
                />
                {existing && <Stamp note={existing} />}
                {existing?.reply && (
                    // The Operator's last reply, stapled to the bottom of the note.
                    <div className="stapled-reply">
                        <span className="staple" />
                        <em>The Operator replied (Rule {existing.replyRule}):</em> {existing.reply}
                    </div>
                )}
                {existing && (
                    <div className="paper-meta">
                        Written {new Date(existing.createdAt).toLocaleString()}
                    </div>
                )}
                {error && <div className="paper-error">{error}</div>}
                <div className="paper-actions">
                    <button type="button" className="btn ghost" onClick={() => void giveUp()} disabled={busy}>
                        {existing ? "Put it back as it was" : "Never mind"}
                    </button>
                    <button type="submit" className="btn" disabled={busy}>
                        {existing ? "Slide it back under" : "Slide it under the door"}
                    </button>
                </div>
            </form>
        </div>
    );
}
