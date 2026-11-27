import { useState } from "react";
import { LIMITS } from "../../shared/constants";
import { useCreateDoor } from "../lib/api";
import { cancelNaming, doorCreated } from "../lib/flow";
import { sounds } from "../lib/sound";

// Shown after the planks come off: name the new door (folder).
export function NamePrompt({ slot }: { slot: number }) {
    const [name, setName] = useState("");
    const createDoor = useCreateDoor();

    return (
        <div className="modal-stage">
            <form
                className="name-card"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!name.trim()) return;
                    createDoor.mutate(
                        { doorSlot: slot, name: name.trim() },
                        {
                            onSuccess: (door) => {
                                sounds.click();
                                void doorCreated(door);
                            },
                        },
                    );
                }}
            >
                <h2>A new doorway!</h2>
                <p>What's behind this one? Give the door a name.</p>
                <input
                    autoFocus
                    value={name}
                    maxLength={LIMITS.doorName}
                    placeholder="e.g. Recipes, Dreams, Secret plans"
                    onChange={(e) => setName(e.target.value)}
                    disabled={createDoor.isPending}
                />
                {createDoor.error && <div className="paper-error">{createDoor.error.message}</div>}
                <div className="paper-actions">
                    <button type="button" className="btn ghost" onClick={() => void cancelNaming()} disabled={createDoor.isPending}>
                        Board it back up
                    </button>
                    <button type="submit" className="btn" disabled={createDoor.isPending || !name.trim()}>
                        Hang the door
                    </button>
                </div>
            </form>
        </div>
    );
}
