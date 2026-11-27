import { glyphOf, type RoomId, type Word } from "../shared/lexicon";

// The four residents of the Institute and what they need. The answers live only here,
// on the server, so they never reach the browser.

type Puzzle = {
    id: RoomId;
    // The resident's note, in words (sent to the browser as glyphs).
    note: Word[];
    // The reply that satisfies them.
    answer: Word[];
    // Their note back once satisfied.
    response: Word[];
    // Words that go into the Phrasebook when solved.
    learns: Word[];
    // Glyph tiles offered for the reply: the answer words plus some decoys.
    tiles: Word[];
};

export const PUZZLES: Puzzle[] = [
    {
        // An ordinary flat. The window is open and it's snowing in.
        id: "flat",
        note: ["I", "cold"],
        answer: ["close", "window"],
        response: ["good"],
        learns: ["cold", "window", "good"],
        tiles: ["close", "open", "window", "door", "light", "bring", "hat"],
    },
    {
        // A party nobody came to. The cat is asleep on the cake.
        id: "party",
        note: ["where", "cake", "?"],
        answer: ["move", "cat"],
        response: ["cake", "good"],
        learns: ["cake", "cat"],
        tiles: ["move", "bring", "cat", "cake", "hat", "open", "you"],
    },
    {
        // An office with a leak. Somebody has been keeping a tally on the wall.
        id: "office",
        note: ["how many", "drips", "?"],
        answer: ["five"],
        response: ["good", "good", "good", "good", "good"],
        learns: ["drips", "bucket", "five"],
        tiles: ["one", "two", "three", "four", "five", "six", "bucket"],
    },
    {
        // The quiet room. Dust sheets, a covered mirror, a chair facing the wall.
        id: "quiet",
        note: ["who", "you", "?"],
        answer: ["I", "operator"],
        response: ["I", "operator", "too"],
        learns: ["operator", "too"],
        tiles: ["I", "you", "operator", "cat", "who", "no", "door"],
    },
];

// A wrong reply gets one of these back.
export const CONFUSED: Word[][] = [["?"], ["?", "?"], ["no"], ["?", "no", "?"], ["no", "no"]];

export const toGlyphs = (words: Word[]) => words.map(glyphOf);
