// The Institute's script: one glyph per word.
//
// Shared by the Worker (which checks your replies) and the front end (which draws notes,
// inventory tags and tiles). The puzzle answers are NOT here: they stay in the Worker.

export const LEXICON = {
    I: "⟟",
    you: "⍦",
    who: "⌬",
    where: "⍜",
    "how many": "⋔",
    "?": "⸮",
    close: "⏚",
    open: "⏃",
    move: "⌇",
    bring: "⎍",
    yes: "⟒",
    no: "⋏",
    good: "⊑",
    too: "⍀",
    cold: "❄︎",
    hot: "⌖",
    window: "⍙",
    door: "⎅",
    light: "⏆",
    cake: "⎊",
    cat: "⏧",
    hat: "⟁",
    drips: "⌰",
    bucket: "⍟",
    operator: "⍝",
    // Institute numerals: dots, like dice.
    one: "⚀",
    two: "⚁",
    three: "⚂",
    four: "⚃",
    five: "⚄",
    six: "⚅",
} as const;

export type Word = keyof typeof LEXICON;

export const glyphOf = (word: Word) => LEXICON[word];

const BY_GLYPH = new Map(Object.entries(LEXICON).map(([w, g]) => [g as string, w as Word]));
export const wordOf = (glyph: string): Word | undefined => BY_GLYPH.get(glyph);

// Words in the Phrasebook on your first night (pinned in your locker).
export const STARTER_WORDS: Word[] = ["I", "you", "who", "where", "how many", "?", "close", "open", "move", "yes", "no"];

// Every word the Institute uses, for pencilling in guesses (in no helpful order).
export const ALL_WORDS = Object.keys(LEXICON) as Word[];

export type RoomId = "flat" | "party" | "office" | "quiet";
export type RoomStatus = "locked" | "waiting" | "solved";

// What GET /api/shift returns.
export type ShiftState = {
    rooms: {
        id: RoomId;
        status: RoomStatus;
        // The resident's note (glyphs), once it has slid out.
        note: string[] | null;
        // Their note back after you answered correctly.
        response: string[] | null;
        // Glyph tiles you can build a reply from.
        tiles: string[] | null;
    }[];
    // Words you can read: [word, glyph].
    phrasebook: [Word, string][];
    finished: boolean;
};

export type AnswerResult = {
    correct: boolean;
    // On a wrong answer, the resident's confused note back.
    response: string[];
    learned: Word[];
    shift: ShiftState;
};
