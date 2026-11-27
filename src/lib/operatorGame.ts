import { glyphFor } from "./glyphs";

// "Your turn to be the Operator": the Chinese Room, from the inside.
// A message arrives in the building's symbols. You find the matching rule and copy out
// the reply, without ever knowing what either one means.

// The hidden meanings. The player only ever sees them as symbols (until the very end).
const PAIRS: { q: string; a: string }[] = [
    { q: "is anyone out there", a: "only the cat" },
    { q: "do you like soup", a: "soup is a hat" },
    { q: "what time is it", a: "always thursday" },
    { q: "are you real", a: "please slide again" },
    { q: "where is my key", a: "under the moon" },
    { q: "can you read this", a: "yes perfectly" },
    { q: "who keeps peeking", a: "nobody important" },
];

// Each English word becomes a short, fixed "word" of 2-3 symbols.
export function encodeWord(word: string) {
    const h = [...word].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 17);
    const len = 2 + (h % 2);
    return Array.from({ length: len }, (_, i) => glyphFor(word[i % word.length], h + i * 5)).join("");
}
const encode = (text: string) => text.split(" ").map(encodeWord);

export type Puzzle = {
    message: string[]; // the incoming paper, as symbol words
    rules: { see: string[]; reply: string[] }[]; // a page of the Rulebook (one rule matches)
    tiles: string[]; // symbol words to build the reply from
    answer: string[];
    meaning: { q: string; a: string };
};

const shuffle = <T>(xs: T[]) => {
    const a = [...xs];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

export function makePuzzle(): Puzzle {
    const [target, ...decoys] = shuffle(PAIRS).slice(0, 4);
    const rules = shuffle([target, ...decoys]).map((p) => ({ see: encode(p.q), reply: encode(p.a) }));
    const answer = encode(target.a);
    // Tiles: the right words plus a few from other replies, so it isn't trivial.
    const extra = decoys.slice(0, 2).flatMap((p) => encode(p.a));
    const tiles = shuffle([...new Set([...answer, ...extra])]);
    return { message: encode(target.q), rules, tiles, answer, meaning: target };
}
