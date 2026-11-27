import { useEffect, useState } from "react";
import { glyphOf, type ShiftState } from "../../shared/lexicon";
import { afterResponse, closeReading } from "../lib/flow";
import { sounds } from "../lib/sound";
import { useView, type Response } from "../stores/view";
import { GlyphCell } from "./Glyph";

const useEscape = (fn: () => void) =>
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && fn();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

// ---------------------------------------------------------------- Their note back

export function ResponseNote({ response }: { response: Response }) {
    const [leaving, setLeaving] = useState(false);
    const done = async () => {
        setLeaving(true);
        await new Promise((r) => setTimeout(r, 350));
        await afterResponse();
    };
    useEscape(() => void done());
    return (
        <div className={`paper-stage ${leaving ? "leaving" : ""}`}>
            <div className={`note-desk response ${leaving ? "paper-out" : "paper-in from-under"}`}>
                <h2>{response.correct ? "A note slides back out" : "Your note comes back"}</h2>
                <div className="glyph-row big">
                    {response.glyphs.map((g, i) => (
                        <GlyphCell key={i} glyph={g} />
                    ))}
                </div>
                {response.correct ? (
                    <>
                        <p>Behind the door, something seems pleased. You've no way of knowing what.</p>
                        {response.learned.length > 0 && (
                            <p className="desk-learned">
                                Pinned in your Phrasebook:{" "}
                                {response.learned.map((w) => (
                                    <span key={w} className="learned-word">
                                        {glyphOf(w)} {w}
                                    </span>
                                ))}
                            </p>
                        )}
                        <div className="stamp" aria-hidden>
                            <strong>ANSWERED</strong>
                            <span>NOT UNDERSTOOD</span>
                        </div>
                    </>
                ) : (
                    <p>A single mark, pressed hard into the paper. They didn't understand you. Or you didn't understand them.</p>
                )}
                <div className="paper-actions">
                    <span />
                    <button className="btn" onClick={() => void done()} disabled={leaving}>
                        {response.correct ? "Back to the hallway" : "Try again"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------- The notice board

const HINTS = {
    flat: "Room 1 feels the cold. Look at what's letting it in.",
    party: "Room 2's guest of honour has fallen asleep somewhere unhelpful.",
    office: "Room 3 counts everything. Somebody has been keeping count on the wall.",
    quiet: "If anyone asks who you are, your staff badge says. It's in your locker.",
} as const;

export function BoardOverlay({ shift }: { shift: ShiftState | undefined }) {
    const tilted = useView((s) => s.boardTilt !== 0);
    const waiting = shift?.rooms.find((r) => r.status === "waiting");
    useEscape(() => void closeReading());
    return (
        <div className="modal-stage" onClick={() => void closeReading()}>
            <div className="board-card" onClick={(e) => e.stopPropagation()}>
                <section className="board-pin">
                    <h3>Night Operator: duties</h3>
                    <ol>
                        <li>Residents talk by sliding notes under their doors. Pick them up.</li>
                        <li>You do not speak their script. Use your Phrasebook (in your locker) and pencil in guesses.</li>
                        <li>Everything in the Institute has an inventory tag. Peek through the keyhole and line one up to read it.</li>
                        <li>Reply using their glyphs, and slide it back under the door.</li>
                        <li>Do not open the doors. The doors do not open.</li>
                    </ol>
                </section>
                <section className="board-pin yellow">
                    <h3>Institute numerals</h3>
                    <div className="numerals">
                        {(["one", "two", "three", "four", "five", "six"] as const).map((n) => (
                            <span key={n}>
                                <b>{glyphOf(n)}</b>
                                {n}
                            </span>
                        ))}
                    </div>
                </section>
                <section className="board-pin blue">
                    <h3>Employee of the Month</h3>
                    <div className="eotm">🐈</div>
                    <p>The cat. (Again.)</p>
                </section>
                <section className="board-pin pink">
                    <h3>Notices</h3>
                    <p>Residents must not be answered after the bell. There is no bell.</p>
                    <p>LOST: one (1) Night Operator. If found, do not return.</p>
                    {tilted && <p className="board-odd">Someone has moved these notices around. Nobody was out here.</p>}
                </section>
                {waiting && (
                    <section className="board-pin green">
                        <h3>Tonight</h3>
                        <p>{HINTS[waiting.id]}</p>
                    </section>
                )}
                <button className="btn board-close" onClick={() => void closeReading()}>
                    Back to the hallway
                </button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------- Your locker

export function LockerOverlay({ shift }: { shift: ShiftState | undefined }) {
    const pencil = useView((s) => s.pencil);
    const known = new Set(shift?.phrasebook.map(([, g]) => g));
    const guesses = Object.entries(pencil).filter(([g]) => !known.has(g));
    useEscape(() => void closeReading());
    return (
        <div className="modal-stage" onClick={() => void closeReading()}>
            <div className="locker-card" onClick={(e) => e.stopPropagation()}>
                <section className="badge">
                    <div className="badge-head">INSTITUTE OF ROOMS · STAFF</div>
                    <div className="badge-photo">◔ ◔</div>
                    <div className="badge-title">{glyphOf("operator")}</div>
                    <div className="badge-foot">NIGHT SHIFT</div>
                </section>
                <section className="phrasebook">
                    <h3>Phrasebook</h3>
                    <div className="phrase-grid">
                        {shift?.phrasebook.map(([word, glyph]) => (
                            <span key={glyph} className="phrase">
                                <b>{glyph}</b>
                                {word}
                            </span>
                        ))}
                    </div>
                    {guesses.length > 0 && (
                        <>
                            <h3>Pencilled guesses</h3>
                            <div className="phrase-grid">
                                {guesses.map(([glyph, word]) => (
                                    <span key={glyph} className="phrase pencilled">
                                        <b>{glyph}</b>
                                        {word}?
                                    </span>
                                ))}
                            </div>
                        </>
                    )}
                    <p className="locker-note">
                        Taped inside the door, in someone else's handwriting: <q>Don't feed the cat. It isn't hungry. It just wants you to know it could be.</q>
                    </p>
                </section>
                <button className="btn locker-close" onClick={() => void closeReading()}>
                    Close the locker
                </button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------- Tannoy

const ANNOUNCEMENTS = [
    "Would the Night Operator please stop peeking. Thank you.",
    "This is a reminder that the doors do not open. Please stop trying the doors.",
    "The cat has been named Employee of the Month. Congratulations to the cat.",
    "Would whoever is in Room 0 please return to Room 0. There is no Room 0.",
    "The leak in the corridor is being monitored. By whom is not important.",
    "Residents are reminded that the Night Operator cannot see you. Mostly.",
];

// Now and then the speaker crackles into life.
export function Tannoy() {
    const hallway = useView((s) => s.mode === "hallway");
    const [message, setMessage] = useState<string | null>(null);
    useEffect(() => {
        if (!hallway) return;
        let shown = 0;
        const next = () => setTimeout(() => {
            sounds.buzz(0.4, 0.04);
            setMessage(ANNOUNCEMENTS[(Math.floor(Math.random() * ANNOUNCEMENTS.length) + shown++) % ANNOUNCEMENTS.length]);
            hide = setTimeout(() => setMessage(null), 7000);
            timer = next();
        }, 30000 + Math.random() * 35000);
        let hide: ReturnType<typeof setTimeout> | undefined;
        let timer = next();
        return () => {
            clearTimeout(timer);
            clearTimeout(hide);
            setMessage(null);
        };
    }, [hallway]);
    return (
        <div className={`tannoy ${message ? "show" : ""}`} aria-live="polite">
            <span className="tannoy-label">TANNOY</span> {message}
        </div>
    );
}

// ---------------------------------------------------------------- The end of the shift

export function Finale() {
    useEscape(() => void closeReading());
    return (
        <div className="modal-stage">
            <div className="name-card intro-card finale">
                <h2>Shift complete</h2>
                <p>Every resident answered. You never saw a single one of them.</p>
                <p>
                    You learned their words by watching, guessing and following the rules, and you answered every note correctly. So: did you
                    understand them? Or did you just get very good at the rules?
                </p>
                <p className="intro-small">
                    This is John Searle's <strong>Chinese Room</strong> (1980): a room that answers perfectly, with nobody inside who understands.
                    The last note said <q>I operator too.</q> Somebody has been answering <em>you</em> all night.
                </p>
                <div className="paper-actions intro-actions">
                    <button className="btn" onClick={() => void closeReading()} autoFocus>
                        Clock off
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------- Something looks back

export function EyeFlash() {
    const eyeAt = useView((s) => s.eyeAt);
    if (eyeAt === null) return null;
    // Keyed by the time, so the one-off CSS animation plays again each time.
    return (
        <div key={eyeAt} className="eye-flash" aria-hidden>
            <svg viewBox="-50 -30 100 60">
                <path d="M-46 0 Q0 -34 46 0 Q0 34 -46 0 Z" fill="#efe6d6" />
                <circle r="16" fill="#3d5a3a" />
                <circle r="7" fill="#050302" />
                <circle cx="-5" cy="-5" r="3" fill="#fff" />
                <path className="eyelid" d="M-46 0 Q0 -34 46 0 Q0 34 -46 0 Z" fill="#2a1a12" />
            </svg>
        </div>
    );
}
