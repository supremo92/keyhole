import type { ShiftState } from "../../shared/lexicon";
import { roomDef } from "../scene/rooms";
import { useView } from "../stores/view";

export function Hud({ shift, onHelp }: { shift: ShiftState | undefined; onHelp: () => void }) {
    const mode = useView((s) => s.mode);
    const roomId = useView((s) => s.roomId);
    const waiting = shift?.rooms.find((r) => r.status === "waiting");
    const roomStatus = shift?.rooms.find((r) => r.id === roomId)?.status;
    const answered = shift?.rooms.filter((r) => r.status === "solved").length ?? 0;

    return (
        <>
            <div className="title">
                <span className="title-key">⚿</span> The Keyhole
                <small className="title-sub">Institute of Rooms · Night shift</small>
            </div>

            {mode === "hallway" && (
                <button className="help-btn" onClick={onHelp} aria-label="How it works">
                    ?
                </button>
            )}

            {mode === "hallway" && shift && (
                <div className="hint">
                    {shift.finished
                        ? "Every resident has been answered. The Institute is quiet. Too quiet."
                        : waiting
                          ? `A note has been slid out under Room ${roomDef(waiting.id).plate}. Pick it up. Scroll or W/S to walk. The notice board and your locker might help.`
                          : "Scroll or use W/S to walk."}
                </div>
            )}

            {mode === "peeking" && roomId && (
                <>
                    <div className="room-name">
                        Room {roomDef(roomId).plate}
                        <small>{roomStatus === "solved" ? "answered" : roomStatus === "waiting" ? "waiting for a reply" : "nothing yet"}</small>
                    </div>
                    <div className="hint top">
                        Move the mouse to look around, and line things up in the keyhole to read them. Look down at the doormat
                        {roomStatus === "waiting" ? " to go back to the note or leave" : " to leave"} (or press S).
                    </div>
                </>
            )}

            {mode === "hallway" && shift && (
                <div className="shift-tally">
                    {answered} / {shift.rooms.length} answered
                </div>
            )}
        </>
    );
}
