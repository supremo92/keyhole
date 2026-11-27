// A short welcome card, shown on the first visit (and from the "?" button).
export function Intro({ onClose }: { onClose: () => void }) {
    return (
        <div className="modal-stage">
            <div className="name-card intro-card">
                <h2>⚿ Welcome to The Keyhole</h2>
                <p>A notes app you can only see through keyholes.</p>
                <ul>
                    <li>
                        <strong>Every door is a folder.</strong> Scroll (or W/S) to walk down the hallway, and click a door to peek through its keyhole.
                    </li>
                    <li>
                        <strong>Slide notes under the door.</strong> Peek again and they'll be resting on a piece of
                        furniture.
                    </li>
                    <li>
                        <strong>Line up a note in the keyhole</strong> to read its label, and click to slide it back out and edit it. The arrow on the floor takes you back.
                    </li>
                    <li>
                        <strong>Boarded-up doorways</strong> can be pried open to make a new door.
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
