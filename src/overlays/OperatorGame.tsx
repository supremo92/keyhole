import { useState } from "react";
import { closeStrayPaper } from "../lib/flow";
import { makePuzzle } from "../lib/operatorGame";
import { sounds } from "../lib/sound";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Your turn to be the Operator. A paper arrives in symbols you can't read. Find the rule
// that matches it, copy out the reply from the tiles, and slide it back under the planks.
export function OperatorGame() {
    const [puzzle] = useState(makePuzzle);
    const [reply, setReply] = useState<string[]>([]);
    const [result, setResult] = useState<"none" | "wrong" | "right">("none");
    const [reveal, setReveal] = useState(false);
    const [leaving, setLeaving] = useState(false);

    const add = (tile: string) => {
        if (result === "right") return;
        sounds.click();
        setResult("none");
        setReply((r) => [...r, tile]);
    };

    function check() {
        const right = reply.join(" ") === puzzle.answer.join(" ");
        if (right) {
            sounds.stamp();
            setResult("right");
        } else {
            sounds.sigh();
            setResult("wrong");
        }
    }

    async function leave(answered: boolean) {
        setLeaving(true);
        await sleep(400);
        await closeStrayPaper(answered);
    }

    return (
        <div className={`paper-stage ${leaving ? "leaving" : ""}`}>
            <div className={`operator-game ${leaving ? "paper-out" : "paper-in from-under"}`}>
                <h2>Your turn to be the Operator</h2>
                <p className="game-intro">A paper has come out from under the planks. You can't read it. That's fine. Nobody here can.</p>

                <div className="game-grid">
                    <section className="game-incoming">
                        <h3>The paper says</h3>
                        <div className="glyph-line big">
                            {puzzle.message.map((w, i) => (
                                <span key={i}>{w}</span>
                            ))}
                        </div>

                        <h3>Your reply</h3>
                        <div className={`glyph-line big reply-line ${result}`}>
                            {reply.length === 0 && <em>Click the tiles below to copy out a reply</em>}
                            {reply.map((w, i) => (
                                <span key={i}>{w}</span>
                            ))}
                        </div>

                        <div className="tiles">
                            {puzzle.tiles.map((t) => (
                                <button key={t} className="tile" onClick={() => add(t)} disabled={result === "right"}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="game-rules">
                        <h3>From the Rulebook, page 12</h3>
                        <ol>
                            {puzzle.rules.map((r, i) => (
                                <li key={i}>
                                    If you see <span className="glyph-line">{r.see.join(" ")}</span>
                                    <br />
                                    reply with <span className="glyph-line">{r.reply.join(" ")}</span>
                                </li>
                            ))}
                        </ol>
                    </section>
                </div>

                {result === "wrong" && <p className="game-msg">The paper is returned. Someone behind the planks sighs. Check the rules and try again.</p>}
                {result === "right" && (
                    <p className="game-msg right">
                        Perfect. Somewhere behind the planks, someone is delighted. You have no idea why.{" "}
                        {!reveal ? (
                            <button className="link-btn" onClick={() => setReveal(true)}>
                                What did I just say?
                            </button>
                        ) : (
                            <span className="game-reveal">
                                They asked <q>{puzzle.meaning.q}?</q> You answered <q>{puzzle.meaning.a}.</q> You understood none of it,
                                and answered perfectly. That's the Chinese Room.
                            </span>
                        )}
                    </p>
                )}

                <div className="paper-actions">
                    {result === "right" ? (
                        <>
                            <span />
                            <button className="btn" onClick={() => void leave(true)} disabled={leaving}>
                                Slide it back under
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn ghost" onClick={() => void leave(false)} disabled={leaving}>
                                Leave it for now
                            </button>
                            <span className="game-actions-right">
                                <button className="btn ghost" onClick={() => setReply((r) => r.slice(0, -1))} disabled={reply.length === 0}>
                                    Erase the last one
                                </button>
                                <button className="btn" onClick={check} disabled={reply.length === 0}>
                                    Check with the Rulebook
                                </button>
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
