import type { Door, Note } from "../../shared/types";
import { leaveRoom, startWriting } from "../lib/flow";
import { useView } from "../stores/view";

export function Hud({ door, notes }: { door: Door | undefined; notes: Note[] | undefined }) {
    const mode = useView((s) => s.mode);

    return (
        <>
            <div className="title">
                <span className="title-key">⚿</span> The Keyhole
            </div>

            {mode === "hallway" && (
                <div className="hint">Click a door to peek through its keyhole. Click a boarded-up doorway to pry it open.</div>
            )}

            {mode === "peeking" && door && (
                <>
                    <div className="room-name">
                        {door.name}
                        <small>
                            {notes?.length ?? 0} note{notes?.length === 1 ? "" : "s"}
                        </small>
                    </div>
                    <div className="hint">
                        {notes?.length
                            ? "Move the mouse to look around. Hover over a note to see its label, click it to take it out."
                            : "An empty room. Slide a note under the door and something will turn up."}
                    </div>
                    <div className="room-actions">
                        <button className="btn ghost" onClick={() => void leaveRoom()}>
                            ← Back to the hallway
                        </button>
                        <button className="btn" onClick={() => void startWriting()}>
                            ✎ Slide a note under the door
                        </button>
                    </div>
                </>
            )}
        </>
    );
}
