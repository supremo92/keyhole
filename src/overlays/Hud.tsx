import type { Door, Note } from "../../shared/types";
import { startWriting } from "../lib/flow";
import { useView } from "../stores/view";

export function Hud({ door, notes, onHelp }: { door: Door | undefined; notes: Note[] | undefined; onHelp: () => void }) {
    const mode = useView((s) => s.mode);

    return (
        <>
            <div className="title">
                <span className="title-key">⚿</span> The Keyhole
            </div>

            {mode === "hallway" && (
                <button className="help-btn" onClick={onHelp} aria-label="How it works">
                    ?
                </button>
            )}

            {mode === "hallway" && (
                <div className="hint">
                    Scroll or use W/S to walk. Click a door to peek through its keyhole, or a boarded-up doorway to pry it open.
                </div>
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
                            ? "Point the mouse to look around. Line something up in the keyhole and click to take its note out. Look down at the arrow to leave."
                            : "An empty room. Slide a note under the door and something will turn up. Look down at the arrow to leave."}
                    </div>
                    <div className="room-actions">
                        <button className="btn" onClick={() => void startWriting()}>
                            ✎ Slide a note under the door
                        </button>
                    </div>
                </>
            )}
        </>
    );
}
