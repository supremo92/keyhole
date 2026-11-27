import type { Door, Note } from "../../shared/types";
import { useView } from "../stores/view";

export function Hud({ door, notes, onHelp }: { door: Door | undefined; notes: Note[] | undefined; onHelp: () => void }) {
    const mode = useView((s) => s.mode);
    const stray = useView((s) => s.strayPaper !== null);

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
                    {stray
                        ? "A paper has slid out from under one of the boarded-up doorways. Someone in there needs an Operator. Click it to pick it up."
                        : "Scroll or use W/S to walk. Click a door to peek through its keyhole, or a boarded-up doorway to pry it open."}
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
                    <div className="hint top">
                        {notes?.length
                            ? "Move the mouse to look around. Line something up in the keyhole and click it: a note, the cat, or the Rulebook on the Operator's desk. Move to the bottom of the screen to write a note or leave."
                            : "An empty room, and an Operator with nothing to do. Move to the bottom of the screen and click the letter to slide a note under the door."}
                    </div>
                </>
            )}
        </>
    );
}
