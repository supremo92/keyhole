// A short welcome card, shown on the first visit (and from the "?" button).
export function Intro({ onClose }: { onClose: () => void }) {
    return (
        <div className="modal-stage">
            <div className="name-card intro-card">
                <h2>⚿ The Institute of Rooms</h2>
                <p>
                    It's your first night shift. Something lives behind every door. They only talk by sliding notes under the door, in a script
                    nobody can read. <strong>Your job is to answer them.</strong>
                </p>
                <p className="intro-small">The residents are not to be seen. They can see you. That is different.</p>
                <ul>
                    <li>
                        <strong>Pick up the note</strong> lying outside a door. Pencil in guesses for the symbols you don't know.
                    </li>
                    <li>
                        <strong>Peek through the keyhole</strong> for clues. Everything in the Institute has an inventory tag: line one up to read
                        its symbol.
                    </li>
                    <li>
                        <strong>Reply in their script</strong> using the glyph tiles, and slide it back under the door.
                    </li>
                    <li>
                        <strong>Your locker</strong> holds your Phrasebook. <strong>The notice board</strong> at the end of the corridor has
                        instructions and hints.
                    </li>
                </ul>
                <div className="paper-actions intro-actions">
                    <button className="btn" onClick={onClose} autoFocus>
                        Clock in
                    </button>
                </div>
            </div>
        </div>
    );
}
