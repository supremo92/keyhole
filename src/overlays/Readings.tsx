import { useEffect, useState } from "react";
import { glyphOf, type ShiftState } from "../../shared/lexicon";
import { afterResponse, closeReading, newNight } from "../lib/flow";
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
    // How did your pencilled guesses do, for the words you've just learned?
    const pencil = useView((s) => s.pencil);
    const guesses = response.learned
        .map((word) => ({ word, glyph: glyphOf(word), guess: pencil[glyphOf(word)] }))
        .filter((g) => g.guess);
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
                        {guesses.length > 0 && (
                            <p className="desk-learned">
                                Your pencilled guesses:{" "}
                                {guesses.map((g) => (
                                    <span key={g.word} className={g.guess === g.word ? "guess-check right" : "guess-check wrong"}>
                                        {g.glyph} {g.guess === g.word ? `${g.word} ✓` : `${g.guess} ✗ (it's ${g.word})`}
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
                    <p>There is no bell. Do not answer the bell. Do not look for the bell. There is no bell.</p>
                    {tilted && <p className="board-odd">Someone has moved these notices around. Nobody was out here.</p>}
                </section>
                <section className="board-pin">
                    <h3>Lost</h3>
                    <p>One (1) Night Operator. If found, do not return.</p>
                </section>
                {waiting && (
                    <section className="board-pin green">
                        <h3>Tonight</h3>
                        <p>{HINTS[waiting.id]}</p>
                    </section>
                )}
                {shift?.finished && (
                    <section className="board-pin green">
                        <h3>Shift complete</h3>
                        <p>Every resident answered. Come back tomorrow night?</p>
                        <button className="btn" onClick={() => void newNight()}>
                            Start a new night
                        </button>
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

// The inside of your locker door: your staff ID hanging from a hook, your Phrasebook stuck
// up with magnets, and a post-it somebody left.
export function LockerOverlay({ shift }: { shift: ShiftState | undefined }) {
    const pencil = useView((s) => s.pencil);
    const known = new Set(shift?.phrasebook.map(([, g]) => g));
    const guesses = Object.entries(pencil).filter(([g]) => !known.has(g));
    useEscape(() => void closeReading());
    return (
        <div className="modal-stage" onClick={() => void closeReading()}>
            <div className="locker-door" onClick={(e) => e.stopPropagation()}>
                <div className="locker-vents" aria-hidden>
                    {Array.from({ length: 6 }, (_, i) => (
                        <span key={i} />
                    ))}
                </div>

                <div className="locker-inside">
                    <div className="badge-hang">
                        <span className="hook" aria-hidden />
                        <span className="lanyard" aria-hidden />
                        {/* Your staff ID. Your job title is printed in their script. */}
                        <section className="badge" aria-label="Your staff ID badge">
                            <div className="badge-head">INSTITUTE OF ROOMS</div>
                            <div className="badge-sub">Staff identification</div>
                            <div className="badge-photo" aria-hidden>
                                <svg viewBox="0 0 60 70">
                                    <circle cx="30" cy="24" r="13" fill="#5d5955" />
                                    <path d="M6 70 Q8 44 30 42 Q52 44 54 70 Z" fill="#5d5955" />
                                </svg>
                            </div>
                            <div className="badge-row">
                                <span>Role</span>
                                <b className="badge-glyph">{glyphOf("operator")}</b>
                            </div>
                            <div className="badge-row">
                                <span>Shift</span>
                                <b>Night</b>
                            </div>
                            <div className="badge-barcode" aria-hidden />
                        </section>
                        <div className="post-it">Don't feed the cat. It isn't hungry anymore.</div>
                    </div>

                    <section className="phrasebook">
                        <h3>Phrasebook</h3>
                        <div className="phrase-grid">
                            {shift?.phrasebook.map(([word, glyph], i) => (
                                <span key={glyph} className="phrase" style={{ rotate: `${((i * 37) % 7) - 3}deg` }}>
                                    <i className="magnet" aria-hidden />
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
                    </section>
                </div>

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
                    <button className="btn ghost" onClick={() => void newNight()}>
                        Start a new night
                    </button>
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
