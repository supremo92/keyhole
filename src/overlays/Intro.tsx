// A short welcome card, shown on the first visit (and from the "?" button).
export function Intro({ onClose }: { onClose: () => void }) {
    return (
        <div className="modal-stage">
            <div className="name-card intro-card">
                <h2>⚿ Welcome to The Keyhole</h2>
                <p>
                    Behind every door in this building sits an <strong>Operator</strong>. They can't read a word you write. They file
                    your notes anyway, by following the Rulebook, and they always reply.
                </p>
                <p className="intro-small">Nobody here understands your notes. They are, however, extremely well organised.</p>
                <ul>
                    <li>
                        <strong>Every door is a folder.</strong> Scroll (or W/S) to walk the hallway. Click a door to peek through its
                        keyhole.
                    </li>
                    <li>
                        <strong>Slide notes under the door.</strong> Look down at the doormat and click the letter. The Operator files
                        your note on a piece of furniture, then sends back a reply.
                    </li>
                    <li>
                        <strong>Line things up in the keyhole</strong> and click: take a note out to read or edit it, open the Rulebook
                        on the Operator's desk, or say hello to the cat.
                    </li>
                    <li>
                        <strong>Boarded-up doorways</strong> can be pried open to make a new door (and hire a new Operator).
                    </li>
                </ul>
                <div className="paper-actions intro-actions">
                    <button className="btn" onClick={onClose} autoFocus>
                        Step into the hallway
                    </button>
                </div>
            </div>
        </div>
    );
}
